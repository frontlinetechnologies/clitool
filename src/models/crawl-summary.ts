/**
 * CrawlSummary model representing aggregated results of a crawl session.
 */

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

