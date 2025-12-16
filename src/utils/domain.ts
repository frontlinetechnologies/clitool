/**
 * Domain extraction and validation utilities.
 * Provides functions to extract domain from URLs and check if URLs belong to the same domain.
 */

/**
 * Extracts the domain from a URL.
 * @param urlString - The URL string
 * @returns The domain (hostname) of the URL
 * @throws Error if URL is invalid
 */
export function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname.toLowerCase();
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

/**
 * Checks if two URLs belong to the same domain.
 * @param url1 - First URL
 * @param url2 - Second URL
 * @returns true if both URLs have the same domain, false otherwise
 */
export function isSameDomain(url1: string, url2: string): boolean {
  try {
    const domain1 = extractDomain(url1);
    const domain2 = extractDomain(url2);
    return domain1 === domain2;
  } catch {
    return false;
  }
}

/**
 * Gets the base URL (protocol + hostname) from a URL string.
 * @param urlString - The URL string
 * @returns The base URL (e.g., "https://example.com")
 * @throws Error if URL is invalid
 */
export function getBaseURL(urlString: string): string {
  try {
    const url = new URL(urlString);
    return `${url.protocol}//${url.hostname}`;
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

