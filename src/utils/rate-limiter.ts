/**
 * Rate limiter utility to enforce delays between requests.
 * Prevents overwhelming target servers with too many requests.
 */

/**
 * Rate limiter that enforces a delay between requests.
 */
export class RateLimiter {
  private lastRequestTime: number = 0;
  private delayMs: number;

  constructor(delaySeconds: number) {
    this.delayMs = delaySeconds * 1000;
  }

  /**
   * Waits for the appropriate delay since the last request.
   * Ensures at least `delaySeconds` seconds between requests.
   */
  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.delayMs) {
      const waitTime = this.delayMs - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Resets the rate limiter (useful for testing).
   */
  reset(): void {
    this.lastRequestTime = 0;
  }
}

/**
 * Creates a rate limiter instance.
 * @param delaySeconds - Delay in seconds between requests
 * @returns A rate limiter instance
 */
export function createRateLimiter(delaySeconds: number): RateLimiter {
  return new RateLimiter(delaySeconds);
}

/**
 * Implements exponential backoff for retrying failed requests.
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @returns Delay in milliseconds
 */
export function exponentialBackoff(attempt: number, baseDelayMs: number = 1000): number {
  return baseDelayMs * Math.pow(2, attempt);
}

