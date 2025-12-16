/**
 * URL validation utilities to prevent SSRF attacks and ensure URL safety.
 * Validates URL format and checks against private/internal network ranges.
 */

import { createError, ErrorType } from './errors';

/**
 * Private/internal network ranges that should be blocked to prevent SSRF.
 */
const PRIVATE_IP_RANGES = [
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '127.0.0.0', end: '127.255.255.255' },
  { start: '169.254.0.0', end: '169.254.255.255' }, // Link-local
  { start: '::1', end: '::1' }, // IPv6 localhost
  { start: 'fc00::', end: 'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' }, // IPv6 private
];

/**
 * Converts an IP address string to a number for comparison.
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return parts[0] * 256 ** 3 + parts[1] * 256 ** 2 + parts[2] * 256 + parts[3];
}

/**
 * Checks if an IP address is in a private range.
 */
function isPrivateIP(ip: string): boolean {
  // Handle IPv6 localhost
  if (ip === '::1') {
    return true;
  }

  // Handle IPv6 private ranges (simplified check)
  if (ip.startsWith('fc00:') || ip.startsWith('fd')) {
    return true;
  }

  // Handle IPv4
  const ipNum = ipToNumber(ip);
  return PRIVATE_IP_RANGES.some((range) => {
    const startNum = ipToNumber(range.start);
    const endNum = ipToNumber(range.end);
    return ipNum >= startNum && ipNum <= endNum;
  });
}

/**
 * Validates URL format and prevents SSRF attacks.
 * @param urlString - The URL string to validate
 * @throws CrawlError if URL is invalid or targets private networks
 */
export function validateURL(urlString: string): void {
  if (!urlString || typeof urlString !== 'string') {
    throw createError(ErrorType.INVALID_URL, 'URL must be a non-empty string');
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch (error) {
    throw createError(
      ErrorType.INVALID_URL,
      `Invalid URL format: ${urlString}`,
      error instanceof Error ? error : undefined,
    );
  }

  // Only allow http and https protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw createError(
      ErrorType.INVALID_URL,
      `Unsupported protocol: ${url.protocol}. Only http:// and https:// are allowed`,
    );
  }

  // Check for private/internal hostnames
  const hostname = url.hostname.toLowerCase();

  // Block localhost variations
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('localhost.')
  ) {
    throw createError(
      ErrorType.SSRF_ATTEMPT,
      `URL targets localhost: ${hostname}`,
    );
  }

  // Block private IP addresses
  if (isPrivateIP(hostname)) {
    throw createError(
      ErrorType.SSRF_ATTEMPT,
      `URL targets private network: ${hostname}`,
    );
  }

  // Block 0.0.0.0
  if (hostname === '0.0.0.0') {
    throw createError(ErrorType.SSRF_ATTEMPT, 'URL targets 0.0.0.0');
  }
}

