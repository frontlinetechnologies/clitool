/**
 * Configuration types for advanced crawl controls.
 * Defines limits, filters, depth tracking, and authentication settings for the crawler.
 */

import type { AuthConfig } from '../auth/types';

/**
 * Configuration options for crawl behavior.
 */
export interface CrawlConfig {
  /** Maximum number of pages to crawl (default: unlimited) */
  maxPages?: number;
  /** Maximum link depth from start URL (0 = start page only, default: unlimited) */
  maxDepth?: number;
  /** URL patterns to include (glob or regex patterns) */
  includePatterns?: string[];
  /** URL patterns to exclude (glob or regex patterns) */
  excludePatterns?: string[];

  // Authentication options
  /** Authentication configuration for authenticated crawling */
  auth?: AuthConfig;
  /** Path to pre-existing Playwright storage state file */
  storageStatePath?: string;
  /** Skip unauthenticated baseline crawl (only crawl with configured roles) */
  skipUnauthenticated?: boolean;
}

/**
 * Represents an item in the crawl queue with depth tracking.
 */
export interface QueueItem {
  /** The URL to crawl */
  url: string;
  /** The depth of this URL from the start URL (0 = start URL) */
  depth: number;
}

/**
 * Reasons why a crawl stopped.
 */
export type StopReason =
  | 'completed'           // All URLs processed
  | 'max_pages_reached'   // Hit maxPages limit
  | 'interrupted'         // User interrupted (Ctrl+C)
  | 'error';              // Fatal error occurred

/**
 * Creates default crawl configuration.
 */
export function createDefaultCrawlConfig(): CrawlConfig {
  return {
    maxPages: undefined,
    maxDepth: undefined,
    includePatterns: undefined,
    excludePatterns: undefined,
    auth: undefined,
    storageStatePath: undefined,
    skipUnauthenticated: false,
  };
}

/**
 * Merges partial config with defaults.
 */
export function mergeCrawlConfig(config?: Partial<CrawlConfig>): CrawlConfig {
  return {
    ...createDefaultCrawlConfig(),
    ...config,
  };
}
