/**
 * Main crawler orchestration.
 * Manages crawl queue, page discovery loop, and result aggregation.
 */

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
  finalizeCrawlSummary,
} from '../models/crawl-summary';
import { createProgressReporter, ProgressReporter } from '../utils/progress';
import { isInterruptedSignal, onInterrupt, removeInterruptHandler } from '../utils/signals';
import { Form } from '../models/form';
import { Button } from '../models/button';
import { InputField } from '../models/input-field';
import { RobotsChecker, createRobotsChecker } from '../parsers/robots-parser';
import { RateLimiter, createRateLimiter } from '../utils/rate-limiter';

export interface CrawlResults {
  summary: CrawlSummary;
  pages: Page[];
  forms: Form[];
  buttons: Button[];
  inputFields: InputField[];
}

export class Crawler {
  private processor: PageProcessor;
  private progressReporter: ProgressReporter;
  private robotsChecker: RobotsChecker | null = null;
  private rateLimiter: RateLimiter;
  private discoveredURLs: Set<string> = new Set();
  private pages: Page[] = [];
  private forms: Form[] = [];
  private buttons: Button[] = [];
  private inputFields: InputField[] = [];
  private redirectChains: Map<string, string[]> = new Map();
  private baseURL: string;

  constructor(
    baseURL: string,
    private readonly quiet: boolean = false,
    rateLimitSeconds: number = 1.5,
  ) {
    this.baseURL = baseURL;
    this.processor = new PageProcessor(baseURL);
    this.progressReporter = createProgressReporter(quiet);
    this.rateLimiter = createRateLimiter(rateLimitSeconds);
  }

  /**
   * Performs the crawl starting from the base URL.
   */
  async crawl(): Promise<CrawlResults> {
    const summary = createCrawlSummary();
    const queue: string[] = [normalizeURL(this.baseURL)];

    // Set up interrupt handler
    const interruptHandler = () => {
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
        const url = queue.shift()!;

        // Skip if already discovered
        if (this.discoveredURLs.has(url)) {
          continue;
        }

        // Check robots.txt
        if (this.robotsChecker && !this.robotsChecker.isAllowed(url)) {
          incrementSkipped(summary);
          continue;
        }

        // Check for infinite redirect loops
        if (this.isRedirectLoop(url)) {
          summary.errors++;
          continue;
        }

        this.discoveredURLs.add(url);

        // Apply rate limiting
        await this.rateLimiter.wait();

        // Process page
        const result = await this.processPage(url, summary);

        // Collect elements
        this.forms.push(...result.elements.forms);
        this.buttons.push(...result.elements.buttons);
        this.inputFields.push(...result.elements.inputFields);

        // Add discovered links to queue
        for (const link of result.links) {
          if (!this.discoveredURLs.has(link)) {
            queue.push(link);
          }
        }

        // Update progress
        this.progressReporter.update(
          this.discoveredURLs.size,
          this.discoveredURLs.size + queue.length,
          url,
        );
      }

      // Check if interrupted
      if (isInterruptedSignal()) {
        const interruptedSummary = markInterrupted(summary);
        removeInterruptHandler(interruptHandler);
        return this.buildResults(interruptedSummary);
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

      // Update summary
      if (result.page.error) {
        incrementErrors(summary);
      } else if (result.page.status >= 200 && result.page.status < 300) {
        incrementTotalPages(summary);
      } else if (result.page.status >= 400) {
        incrementErrors(summary);
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

    return {
      summary,
      pages: this.pages,
      forms: this.forms,
      buttons: this.buttons,
      inputFields: this.inputFields,
    };
  }
}

