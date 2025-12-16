/**
 * Page processor for loading and extracting content from web pages.
 * Uses Playwright to handle JavaScript-rendered content and extract links.
 */

import { chromium, Browser } from 'playwright';
import * as cheerio from 'cheerio';
import { Page, createPage, markPageProcessed, addLinksToPage, setPageError } from '../models/page';
import { isSameDomain } from '../utils/domain';
import { normalizeURL } from './url-normalizer';
import { parseHTML, ParsedElements } from '../parsers/html-parser';
import { exponentialBackoff } from '../utils/rate-limiter';

export interface ProcessPageResult {
  page: Page;
  links: string[];
  elements: ParsedElements;
}

export class PageProcessor {
  private browser: Browser | null = null;

  constructor(_baseURL: string) {
    // Base URL stored for potential future use
  }

  /**
   * Initializes the browser instance.
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
  }

  /**
   * Processes a single page: loads it, extracts content, and discovers links.
   */
  async processPage(url: string): Promise<ProcessPageResult> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = createPage(url, 0, new Date());
    let links: string[] = [];

    try {
      const playwrightPage = await this.browser!.newPage();
      
      // Retry logic for 429 responses with exponential backoff
      let response = null;
      let attempt = 0;
      const maxRetries = 3;

      while (attempt <= maxRetries) {
        try {
          response = await playwrightPage.goto(url, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          const status = response?.status() || 200;

          // If 429, wait and retry
          if (status === 429 && attempt < maxRetries) {
            const backoffDelay = exponentialBackoff(attempt, 1000);
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            attempt++;
            continue;
          }

          // Success or non-retryable error
          break;
        } catch (error) {
          // Check if it's a 429 error
          if (attempt < maxRetries && error instanceof Error && error.message.includes('429')) {
            const backoffDelay = exponentialBackoff(attempt, 1000);
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            attempt++;
            continue;
          }
          throw error;
        }
      }

      const status = response?.status() || 200;
      const finalURL = response?.url() || url;

      // Handle redirects
      if (finalURL !== url && isSameDomain(finalURL, url)) {
        // Same-domain redirect - update page URL
        page.url = normalizeURL(finalURL);
      } else if (!isSameDomain(finalURL, url)) {
        // External redirect - skip
        await playwrightPage.close();
        return {
          page: {
            ...page,
            status: response?.status() || 301,
            error: 'Redirected to external domain',
          },
          links: [],
          elements: { forms: [], buttons: [], inputFields: [] },
        };
      }

      // Extract HTML content
      const html = await playwrightPage.content();

      // Extract title
      const $ = cheerio.load(html);
      const title = $('title').text().trim() || undefined;

      // Extract links (same domain only)
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            // Resolve relative URLs
            const absoluteURL = new URL(href, url).toString();
            if (isSameDomain(absoluteURL, url)) {
              links.push(normalizeURL(absoluteURL));
            }
          } catch {
            // Invalid URL, skip
          }
        }
      });

      // Extract interactive elements
      const elements = parseHTML(html, finalURL);

      await playwrightPage.close();

      const processedPage = markPageProcessed(
        addLinksToPage({ ...page, status, title }, links),
      );

      return {
        page: processedPage,
        links: [...new Set(links)], // Deduplicate
        elements,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      const errorPage = setPageError(
        markPageProcessed(page),
        errorMessage,
      );

      // Determine status code from error
      let status = 0;
      if (errorMessage.includes('404')) {
        status = 404;
      } else if (errorMessage.includes('403')) {
        status = 403;
      } else if (errorMessage.includes('500')) {
        status = 500;
      } else if (errorMessage.includes('timeout')) {
        status = 408;
      }

      return {
        page: { ...errorPage, status },
        links: [],
        elements: { forms: [], buttons: [], inputFields: [] },
      };
    }
  }

  /**
   * Closes the browser instance.
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

