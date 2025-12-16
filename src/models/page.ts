/**
 * Page model representing a discovered web page during crawl.
 */

export interface Page {
  url: string;
  status: number;
  title?: string;
  discoveredAt: string; // ISO 8601 timestamp
  processedAt?: string; // ISO 8601 timestamp
  links?: string[]; // Array of normalized URLs discovered on this page (same domain only)
  error?: string; // Error message if page could not be accessed
}

/**
 * Creates a Page instance.
 */
export function createPage(
  url: string,
  status: number,
  discoveredAt: Date = new Date(),
): Page {
  return {
    url,
    status,
    discoveredAt: discoveredAt.toISOString(),
  };
}

/**
 * Marks a page as processed.
 */
export function markPageProcessed(page: Page, processedAt: Date = new Date()): Page {
  return {
    ...page,
    processedAt: processedAt.toISOString(),
  };
}

/**
 * Adds links to a page.
 */
export function addLinksToPage(page: Page, links: string[]): Page {
  return {
    ...page,
    links,
  };
}

/**
 * Sets an error on a page.
 */
export function setPageError(page: Page, error: string): Page {
  return {
    ...page,
    error,
  };
}

