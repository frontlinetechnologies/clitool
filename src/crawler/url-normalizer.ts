/**
 * URL normalization and deduplication utilities.
 * Normalizes URLs by removing fragments, normalizing trailing slashes, and preserving query strings.
 */

/**
 * Normalizes a URL by:
 * - Removing fragment (#section)
 * - Normalizing trailing slash (directory-like paths get trailing slash, files don't)
 * - Preserving query strings as-is
 * @param urlString - The URL to normalize
 * @returns Normalized URL string
 */
export function normalizeURL(urlString: string): string {
  try {
    const url = new URL(urlString);

    // Remove fragment
    url.hash = '';

    // Normalize trailing slash
    const pathname = url.pathname;
    if (pathname && pathname !== '/') {
      // Get the last non-empty segment to check for file extension
      const segments = pathname.split('/').filter((s) => s.length > 0);
      const lastSegment = segments.length > 0 ? segments[segments.length - 1] : '';
      const hasExtension = /\.[a-zA-Z0-9]+$/.test(lastSegment);
      
      if (hasExtension && pathname.endsWith('/')) {
        // File with trailing slash - remove it
        url.pathname = pathname.slice(0, -1);
      } else if (!hasExtension && !pathname.endsWith('/')) {
        // Directory-like path without trailing slash - add it
        url.pathname = pathname + '/';
      }
    } else if (pathname === '' && !urlString.endsWith('/')) {
      // Root path - ensure trailing slash
      url.pathname = '/';
    }

    // Query string is preserved as-is by URL constructor
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original (will be caught by validator)
    return urlString;
  }
}

/**
 * Deduplicates an array of URLs by normalizing them first.
 * @param urls - Array of URLs to deduplicate
 * @returns Array of unique normalized URLs
 */
export function deduplicateURLs(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    const normalized = normalizeURL(url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

