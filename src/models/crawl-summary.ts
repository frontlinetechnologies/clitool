/**
 * CrawlSummary model representing aggregated results of a crawl session.
 */

/**
 * Reasons why a crawl stopped.
 */
export type StopReason =
  | 'completed'           // All URLs processed
  | 'max_pages_reached'   // Hit maxPages limit
  | 'interrupted'         // User interrupted (Ctrl+C)
  | 'error';              // Fatal error occurred

export interface CrawlSummary {
  totalPages: number;
  totalForms: number;
  totalButtons: number;
  totalInputFields: number;
  errors: number;
  skipped: number;
  interrupted: boolean;
  startTime: string; // ISO 8601 timestamp
  endTime?: string; // ISO 8601 timestamp (null if interrupted)
  duration?: number; // Duration in seconds (null if interrupted)
  stopReason?: StopReason; // Why the crawl stopped
  maxPagesLimit?: number; // The maxPages limit if set
  maxDepthLimit?: number; // The maxDepth limit if set
}

/**
 * Creates a new CrawlSummary with start time.
 */
export function createCrawlSummary(startTime: Date = new Date()): CrawlSummary {
  return {
    totalPages: 0,
    totalForms: 0,
    totalButtons: 0,
    totalInputFields: 0,
    errors: 0,
    skipped: 0,
    interrupted: false,
    startTime: startTime.toISOString(),
  };
}

/**
 * Increments the total pages count.
 */
export function incrementTotalPages(summary: CrawlSummary): CrawlSummary {
  return {
    ...summary,
    totalPages: summary.totalPages + 1,
  };
}

/**
 * Increments the errors count.
 */
export function incrementErrors(summary: CrawlSummary): CrawlSummary {
  return {
    ...summary,
    errors: summary.errors + 1,
  };
}

/**
 * Increments the skipped count.
 */
export function incrementSkipped(summary: CrawlSummary): CrawlSummary {
  return {
    ...summary,
    skipped: summary.skipped + 1,
  };
}

/**
 * Marks the crawl as interrupted.
 */
export function markInterrupted(summary: CrawlSummary): CrawlSummary {
  return {
    ...summary,
    interrupted: true,
    stopReason: 'interrupted',
  };
}

/**
 * Marks the crawl as stopped due to maxPages limit.
 */
export function markMaxPagesReached(summary: CrawlSummary): CrawlSummary {
  return {
    ...summary,
    stopReason: 'max_pages_reached',
  };
}

/**
 * Marks the crawl as completed normally.
 */
export function markCompleted(summary: CrawlSummary): CrawlSummary {
  return {
    ...summary,
    stopReason: 'completed',
  };
}

/**
 * Finalizes the crawl summary with end time and duration.
 */
export function finalizeCrawlSummary(
  summary: CrawlSummary,
  endTime: Date = new Date(),
): CrawlSummary {
  const start = new Date(summary.startTime);
  const end = endTime;
  const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

  return {
    ...summary,
    endTime: end.toISOString(),
    duration,
  };
}

