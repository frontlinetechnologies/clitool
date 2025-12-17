/**
 * URL filtering utility for crawl controls.
 * Supports glob patterns (via micromatch) and regex patterns.
 */

import micromatch from 'micromatch';

/**
 * URL filter for include/exclude pattern matching.
 */
export interface URLFilter {
  /**
   * Checks if a URL should be crawled based on include/exclude patterns.
   * @param url - The URL to check
   * @returns true if the URL should be crawled, false otherwise
   */
  shouldCrawl(url: string): boolean;
}

/**
 * Checks if a pattern is a regex (enclosed in /.../).
 */
function isRegexPattern(pattern: string): boolean {
  return pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2;
}

/**
 * Parses a regex pattern string into a RegExp object.
 */
function parseRegexPattern(pattern: string): RegExp {
  // Remove leading and trailing slashes
  const regexBody = pattern.slice(1, -1);
  return new RegExp(regexBody);
}

/**
 * Tests if a URL matches a single pattern (glob or regex).
 */
function matchesPattern(url: string, pattern: string): boolean {
  if (isRegexPattern(pattern)) {
    try {
      const regex = parseRegexPattern(pattern);
      return regex.test(url);
    } catch {
      // Invalid regex, treat as glob
      return micromatch.isMatch(url, pattern);
    }
  }

  // Use micromatch for glob patterns
  return micromatch.isMatch(url, pattern);
}

/**
 * Tests if a URL matches any pattern in the list.
 */
function matchesAnyPattern(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(url, pattern));
}

/**
 * Creates a URL filter with the given include/exclude patterns.
 *
 * Filtering logic:
 * 1. If include patterns are provided, URL must match at least one include pattern
 * 2. If exclude patterns are provided, URL must not match any exclude pattern
 * 3. Include patterns are evaluated first (whitelist), then exclude patterns (blacklist)
 *
 * @param includePatterns - Patterns for URLs to include (glob or regex)
 * @param excludePatterns - Patterns for URLs to exclude (glob or regex)
 * @returns URLFilter instance
 */
export function createURLFilter(
  includePatterns?: string[],
  excludePatterns?: string[],
): URLFilter {
  const hasIncludePatterns = includePatterns && includePatterns.length > 0;
  const hasExcludePatterns = excludePatterns && excludePatterns.length > 0;

  return {
    shouldCrawl(url: string): boolean {
      // If include patterns exist, URL must match at least one
      if (hasIncludePatterns && includePatterns) {
        if (!matchesAnyPattern(url, includePatterns)) {
          return false;
        }
      }

      // If exclude patterns exist, URL must not match any
      if (hasExcludePatterns && excludePatterns) {
        if (matchesAnyPattern(url, excludePatterns)) {
          return false;
        }
      }

      return true;
    },
  };
}

/**
 * Creates a permissive filter that allows all URLs.
 */
export function createPermissiveFilter(): URLFilter {
  return {
    shouldCrawl(): boolean {
      return true;
    },
  };
}
