/**
 * Error handling utilities for the web crawler.
 * Provides structured error types and a base error class for consistent error handling.
 */

export enum ErrorType {
  INVALID_URL = 'INVALID_URL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SSRF_ATTEMPT = 'SSRF_ATTEMPT',
  PARSE_ERROR = 'PARSE_ERROR',
  CRAWL_ERROR = 'CRAWL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class CrawlError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'CrawlError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CrawlError);
    }
  }

  /**
   * Creates a user-friendly error message with actionable guidance.
   */
  toUserMessage(): string {
    switch (this.type) {
      case ErrorType.INVALID_URL:
        return `Invalid URL: ${this.message}. Please provide a valid URL starting with http:// or https://`;
      case ErrorType.SSRF_ATTEMPT:
        return `Security error: ${this.message}. The URL appears to target internal/private networks.`;
      case ErrorType.NETWORK_ERROR:
        return `Network error: ${this.message}. Check your internet connection and try again.`;
      case ErrorType.PARSE_ERROR:
        return `Parse error: ${this.message}. The page content could not be parsed.`;
      case ErrorType.CRAWL_ERROR:
        return `Crawl error: ${this.message}. The crawl encountered an issue.`;
      default:
        return `Error: ${this.message}`;
    }
  }
}

/**
 * Creates an error with appropriate type and message.
 */
export function createError(
  type: ErrorType,
  message: string,
  cause?: Error,
): CrawlError {
  return new CrawlError(type, message, cause);
}

