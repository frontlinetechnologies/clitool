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

  // Auth-related fields (optional, added during authenticated crawls)
  /**
   * Required authentication level to access this page.
   * 'public' = no auth required
   * 'authenticated' = any logged-in user
   * 'unknown' = not yet determined
   * string = specific role name required
   */
  authLevel?: 'public' | 'authenticated' | 'unknown' | string;

  /** Roles that can access this page */
  accessibleByRoles?: string[];

  /** Minimum privilege level required (0 = public) */
  minPrivilegeLevel?: number;
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

/**
 * Sets auth level on a page.
 */
export function setPageAuthLevel(
  page: Page,
  authLevel: 'public' | 'authenticated' | 'unknown' | string,
  accessibleByRoles?: string[],
  minPrivilegeLevel?: number,
): Page {
  return {
    ...page,
    authLevel,
    accessibleByRoles,
    minPrivilegeLevel,
  };
}

/**
 * Creates an authenticated page from a base page.
 */
export function createAuthenticatedPage(
  page: Page,
  authLevel: 'public' | 'authenticated' | string = 'unknown',
  accessibleByRoles: string[] = [],
  minPrivilegeLevel = 0,
): Page {
  return {
    ...page,
    authLevel,
    accessibleByRoles,
    minPrivilegeLevel,
  };
}

