/**
 * Main crawler orchestration.
 * Manages crawl queue, page discovery loop, and result aggregation.
 */

import type { BrowserContext } from 'playwright';
import { PageProcessor, ProcessPageResult } from './page-processor';
import { normalizeURL } from './url-normalizer';
import { Page } from '../models/page';
import {
  CrawlSummary,
  createCrawlSummary,
  incrementTotalPages,
  incrementErrors,
  incrementSkipped,
  markInterrupted,
  markMaxPagesReached,
  markCompleted,
  finalizeCrawlSummary,
} from '../models/crawl-summary';
import { createProgressReporter, ProgressReporter } from '../utils/progress';
import { isInterruptedSignal, onInterrupt, removeInterruptHandler } from '../utils/signals';
import { Form } from '../models/form';
import { Button } from '../models/button';
import { InputField } from '../models/input-field';
import { RobotsChecker, createRobotsChecker } from '../parsers/robots-parser';
import { RateLimiter, createRateLimiter } from '../utils/rate-limiter';
import { CrawlConfig, QueueItem, mergeCrawlConfig } from './crawl-config';
import { URLFilter, createURLFilter, createPermissiveFilter } from '../utils/url-filter';
import type { AuthEvent } from '../auth/types';

export interface CrawlResults {
  summary: CrawlSummary;
  pages: Page[];
  forms: Form[];
  buttons: Button[];
  inputFields: InputField[];
  /** Authentication events that occurred during crawl (if authenticated) */
  authEvents?: AuthEvent[];
  /** Role name if this was an authenticated crawl */
  roleName?: string;
}

export class Crawler {
  private processor: PageProcessor;
  private progressReporter: ProgressReporter;
  private robotsChecker: RobotsChecker | null = null;
  private rateLimiter: RateLimiter;
  private urlFilter: URLFilter;
  private discoveredURLs: Set<string> = new Set();
  private pages: Page[] = [];
  private forms: Form[] = [];
  private buttons: Button[] = [];
  private inputFields: InputField[] = [];
  private redirectChains: Map<string, string[]> = new Map();
  private baseURL: string;
  private config: CrawlConfig;
  private authContext: BrowserContext | null = null;
  private authEvents: AuthEvent[] = [];
  private roleName?: string;

  constructor(
    baseURL: string,
    private readonly quiet: boolean = false,
    rateLimitSeconds: number = 1.5,
    config?: Partial<CrawlConfig>,
  ) {
    this.baseURL = baseURL;
    this.config = mergeCrawlConfig(config);
    this.processor = new PageProcessor(baseURL);
    this.progressReporter = createProgressReporter(quiet, this.config.maxPages);
    this.rateLimiter = createRateLimiter(rateLimitSeconds);
    this.urlFilter = this.config.includePatterns || this.config.excludePatterns
      ? createURLFilter(this.config.includePatterns, this.config.excludePatterns)
      : createPermissiveFilter();
  }

  /**
   * Sets an authenticated browser context for the crawler.
   * When set, the crawler will use this context for all page requests.
   * @param context - Authenticated browser context
   * @param roleName - Name of the role for logging
   */
  setAuthContext(context: BrowserContext, roleName?: string): void {
    this.authContext = context;
    this.roleName = roleName;
    // Pass the context to the page processor
    this.processor.setContext(context);
  }

  /**
   * Clears the authenticated context.
   */
  clearAuthContext(): void {
    this.authContext = null;
    this.roleName = undefined;
    this.processor.clearContext();
  }

  /**
   * Adds authentication events to the crawl results.
   * @param events - Array of auth events to add
   */
  addAuthEvents(events: AuthEvent[]): void {
    this.authEvents.push(...events);
  }

  /**
   * Gets whether this crawler has an authenticated context.
   */
  isAuthenticated(): boolean {
    return this.authContext !== null;
  }

  /**
   * Performs the crawl starting from the base URL.
   */
  async crawl(): Promise<CrawlResults> {
    let summary = createCrawlSummary();

    // Store limits in summary for display
    if (this.config.maxPages !== undefined) {
      summary.maxPagesLimit = this.config.maxPages;
    }
    if (this.config.maxDepth !== undefined) {
      summary.maxDepthLimit = this.config.maxDepth;
    }

    // Use QueueItem to track depth
    const startUrl = normalizeURL(this.baseURL);
    const queue: QueueItem[] = [{ url: startUrl, depth: 0 }];
    this.discoveredURLs.add(startUrl);

    // Set up interrupt handler
    const interruptHandler = (): void => {
      // Interrupt flag is set by signal handler
    };
    onInterrupt(interruptHandler);

    try {
      await this.processor.initialize();

      // Initialize robots.txt checker
      try {
        this.robotsChecker = await createRobotsChecker(this.baseURL);
      } catch (error) {
        // If robots.txt check fails, continue without it (allow all)
        if (!this.quiet) {
          console.warn('Warning: Could not fetch robots.txt, proceeding without restrictions');
        }
      }

      while (queue.length > 0 && !isInterruptedSignal()) {
        // Check maxPages limit
        if (this.config.maxPages !== undefined && this.pages.length >= this.config.maxPages) {
          summary = markMaxPagesReached(summary);
          break;
        }

        const item = queue.shift()!;
        const { url, depth } = item;

        // Check URL filter
        if (!this.urlFilter.shouldCrawl(url)) {
          const updatedSummary = incrementSkipped(summary);
          Object.assign(summary, updatedSummary);
          continue;
        }

        // Check robots.txt
        if (this.robotsChecker && !this.robotsChecker.isAllowed(url)) {
          const updatedSummary = incrementSkipped(summary);
          Object.assign(summary, updatedSummary);
          continue;
        }

        // Check for infinite redirect loops
        if (this.isRedirectLoop(url)) {
          summary.errors++;
          continue;
        }

        // Apply rate limiting
        await this.rateLimiter.wait();

        // Process page
        const result = await this.processPage(url, summary);

        // Collect elements
        this.forms.push(...result.elements.forms);
        this.buttons.push(...result.elements.buttons);
        this.inputFields.push(...result.elements.inputFields);

        // Add discovered links to queue (with depth tracking)
        const nextDepth = depth + 1;
        const canQueueLinks = this.config.maxDepth === undefined || nextDepth <= this.config.maxDepth;

        if (canQueueLinks) {
          for (const link of result.links) {
            if (!this.discoveredURLs.has(link)) {
              this.discoveredURLs.add(link);
              queue.push({ url: link, depth: nextDepth });
            }
          }
        }

        // Update progress
        this.progressReporter.update(
          this.pages.length,
          this.pages.length + queue.length,
          url,
        );
      }

      // Check if interrupted
      if (isInterruptedSignal()) {
        const interruptedSummary = markInterrupted(summary);
        removeInterruptHandler(interruptHandler);
        return this.buildResults(finalizeCrawlSummary(interruptedSummary));
      }

      // Mark as completed if not stopped by maxPages
      if (summary.stopReason !== 'max_pages_reached') {
        summary = markCompleted(summary);
      }

      // Finalize summary
      const finalizedSummary = finalizeCrawlSummary(summary);
      this.progressReporter.finish();
      removeInterruptHandler(interruptHandler);

      return this.buildResults(finalizedSummary);
    } catch (error) {
      removeInterruptHandler(interruptHandler);
      throw error;
    } finally {
      await this.processor.close();
    }
  }

  /**
   * Processes a single page and updates the summary.
   */
  private async processPage(
    url: string,
    summary: CrawlSummary,
  ): Promise<ProcessPageResult> {
    try {
      const result = await this.processor.processPage(url);

      // Track redirect chain
      if (result.page.status >= 300 && result.page.status < 400) {
        this.trackRedirect(url, result.page.url);
      }

      // Check if page redirected to an already-processed URL
      const finalUrl = normalizeURL(result.page.url);
      if (finalUrl !== url && this.discoveredURLs.has(finalUrl)) {
        // Skip this page - we already have the redirect destination
        const updatedSummary = incrementSkipped(summary);
        Object.assign(summary, updatedSummary);
        return {
          page: result.page,
          links: [],
          elements: { forms: [], buttons: [], inputFields: [] },
        };
      }

      // Mark redirect destination as discovered to prevent future duplicates
      if (finalUrl !== url) {
        this.discoveredURLs.add(finalUrl);
      }

      // Update summary
      if (result.page.error) {
        const updatedSummary = incrementErrors(summary);
        Object.assign(summary, updatedSummary);
      } else if (result.page.status >= 200 && result.page.status < 300) {
        const updatedSummary = incrementTotalPages(summary);
        Object.assign(summary, updatedSummary);
      } else if (result.page.status >= 400) {
        const updatedSummary = incrementErrors(summary);
        Object.assign(summary, updatedSummary);
      }

      this.pages.push(result.page);

      return result;
    } catch (error) {
      incrementErrors(summary);
      const errorPage: Page = {
        url,
        status: 0,
        discoveredAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.pages.push(errorPage);

      return {
        page: errorPage,
        links: [],
        elements: { forms: [], buttons: [], inputFields: [] },
      };
    }
  }

  /**
   * Tracks redirect chains to detect loops.
   */
  private trackRedirect(from: string, to: string): void {
    const chain = this.redirectChains.get(from) || [];
    chain.push(to);

    // Limit chain length to prevent memory issues
    if (chain.length > 10) {
      chain.shift();
    }

    this.redirectChains.set(from, chain);
  }

  /**
   * Checks if a URL is part of an infinite redirect loop.
   */
  private isRedirectLoop(url: string): boolean {
    for (const chain of this.redirectChains.values()) {
      if (chain.length >= 2 && chain[0] === chain[chain.length - 1]) {
        // Found a loop
        if (chain.includes(url)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Builds the final crawl results.
   */
  private buildResults(summary: CrawlSummary): CrawlResults {
    // Update summary with element counts
    summary.totalForms = this.forms.length;
    summary.totalButtons = this.buttons.length;
    summary.totalInputFields = this.inputFields.length;
    // Sync totalPages with actual pages array length (in case increments were missed)
    summary.totalPages = this.pages.length;

    const result: CrawlResults = {
      summary,
      pages: this.pages,
      forms: this.forms,
      buttons: this.buttons,
      inputFields: this.inputFields,
    };

    // Include auth events if any were recorded
    if (this.authEvents.length > 0) {
      result.authEvents = this.authEvents;
    }

    // Include role name if authenticated crawl
    if (this.roleName) {
      result.roleName = this.roleName;
    }

    return result;
  }
}

