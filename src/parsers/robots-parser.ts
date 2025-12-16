/**
 * Robots.txt parser for respecting crawling rules.
 * Fetches and parses robots.txt files to determine allowed/disallowed paths.
 */

import robotsParser from 'robots-parser';

export interface RobotsChecker {
  isAllowed(url: string, userAgent?: string): boolean;
}

class RobotsCheckerImpl implements RobotsChecker {
  private robots: ReturnType<typeof robotsParser> | null = null;
  private baseURL: string;
  private userAgent: string;

  constructor(baseURL: string, userAgent: string = '*') {
    this.baseURL = baseURL;
    this.userAgent = userAgent;
  }

  /**
   * Fetches and parses robots.txt for the base URL.
   */
  async initialize(): Promise<void> {
    try {
      const robotsURL = new URL('/robots.txt', this.baseURL).toString();
      const response = await fetch(robotsURL, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (response.ok) {
        const robotsTxt = await response.text();
        this.robots = robotsParser(robotsURL, robotsTxt);
      } else {
        // No robots.txt or error - allow all
        this.robots = null;
      }
    } catch (error) {
      // Network error or invalid robots.txt - allow all
      this.robots = null;
    }
  }

  /**
   * Checks if a URL is allowed by robots.txt rules.
   * @param url - URL to check
   * @param userAgent - Optional user agent (defaults to constructor value)
   * @returns true if allowed, false if disallowed
   */
  isAllowed(url: string, userAgent?: string): boolean {
    if (!this.robots) {
      // No robots.txt - allow all
      return true;
    }

    const agent = userAgent || this.userAgent;
    return this.robots.isAllowed(url, agent) ?? true; // Default to allowed if unclear
  }
}

/**
 * Creates a robots.txt checker for a given base URL.
 * @param baseURL - Base URL of the site to crawl
 * @param userAgent - User agent string (defaults to '*')
 * @returns A robots checker instance
 */
export async function createRobotsChecker(
  baseURL: string,
  userAgent: string = '*',
): Promise<RobotsChecker> {
  const checker = new RobotsCheckerImpl(baseURL, userAgent);
  await checker.initialize();
  return checker;
}

