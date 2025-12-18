/**
 * Form-based login authentication method.
 * Handles email/password form authentication.
 */

import type { BrowserContext, Page } from 'playwright';
import type { LoginConfig, LoginSelectors } from '../types';
import { LoginDetector } from '../login-detector';
import { AuthenticationError, LoginFormNotFoundError } from '../errors';

/**
 * Error indicating the login URL is unreachable.
 */
export class LoginUrlUnreachableError extends Error {
  constructor(
    public readonly loginUrl: string,
    public readonly cause?: Error,
  ) {
    super(`Login URL unreachable: ${loginUrl}`);
    this.name = 'LoginUrlUnreachableError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LoginUrlUnreachableError);
    }
  }

  /**
   * Creates a user-friendly error message.
   * Maps to CLI error code: AUTH004
   */
  toUserMessage(): string {
    const causeMsg = this.cause?.message ? `: ${this.cause.message}` : '';
    return `AUTH004: Login URL unreachable or incorrect: ${this.loginUrl}${causeMsg}. Verify the URL is correct and accessible.`;
  }
}

/**
 * Default timeout for login operations (ms).
 */
const DEFAULT_LOGIN_TIMEOUT = 30000;

/**
 * Default max retries for rate-limited requests.
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * Rate-limited status codes.
 */
const RATE_LIMITED_CODES = [429];

/**
 * Server error codes that may warrant retry.
 */
const RETRYABLE_SERVER_CODES = [500, 502, 503, 504];

/**
 * Calculates exponential backoff delay.
 */
function exponentialBackoff(attempt: number, baseDelayMs = 1000): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  // Add jitter (0-25% of delay)
  const jitter = delay * 0.25 * Math.random();
  return Math.min(delay + jitter, 30000); // Cap at 30 seconds
}

/**
 * Credentials for form login.
 */
export interface FormCredentials {
  identifier: string;
  password: string;
}

/**
 * Form-based login authentication.
 */
export class FormLoginMethod {
  private detector: LoginDetector;

  constructor() {
    this.detector = new LoginDetector();
  }

  /**
   * Performs form-based login.
   * @param context - Browser context to use
   * @param config - Login configuration
   * @param credentials - Credential values
   * @returns true if login successful
   */
  async login(
    context: BrowserContext,
    config: LoginConfig,
    credentials: FormCredentials,
  ): Promise<boolean> {
    // Get or create page
    let page: Page;
    const pages = context.pages();
    if (pages.length > 0) {
      page = pages[0];
    } else {
      page = await context.newPage();
    }

    try {
      // Navigate to login page with retry logic for rate limiting
      let response;
      let attempt = 0;

      while (attempt <= DEFAULT_MAX_RETRIES) {
        try {
          response = await page.goto(config.url, { timeout: DEFAULT_LOGIN_TIMEOUT });
        } catch (navError) {
          // Navigation failed - URL unreachable, DNS failure, timeout, etc.
          // Check if it's a timeout that might be worth retrying
          if (
            attempt < DEFAULT_MAX_RETRIES &&
            navError instanceof Error &&
            navError.message.toLowerCase().includes('timeout')
          ) {
            const backoffDelay = exponentialBackoff(attempt);
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            attempt++;
            continue;
          }
          throw new LoginUrlUnreachableError(
            config.url,
            navError instanceof Error ? navError : undefined,
          );
        }

        // Check if response indicates page is unreachable
        if (!response) {
          throw new LoginUrlUnreachableError(config.url);
        }

        // Check for rate limiting or retryable server errors
        const status = response.status();
        if (
          (RATE_LIMITED_CODES.includes(status) || RETRYABLE_SERVER_CODES.includes(status)) &&
          attempt < DEFAULT_MAX_RETRIES
        ) {
          const backoffDelay = exponentialBackoff(attempt);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          attempt++;
          continue;
        }

        // Check for error status codes
        if (status >= 400) {
          throw new LoginUrlUnreachableError(
            config.url,
            new Error(`HTTP ${status} response`),
          );
        }

        // Success - break out of retry loop
        break;
      }

      await page.waitForLoadState('domcontentloaded');

      // Get selectors (use configured or auto-detect)
      // Reset tracked selectors before attempting
      this.lastAttemptedSelectors = [];
      const selectors = await this.getSelectors(page, config);

      if (!selectors || !selectors.password) {
        throw new LoginFormNotFoundError(config.url, this.lastAttemptedSelectors);
      }

      // Fill credentials
      if (selectors.identifier) {
        await page.locator(selectors.identifier).first().fill(credentials.identifier);
      }

      await page.locator(selectors.password).first().fill(credentials.password);

      // Handle CSRF token if present
      await this.handleCSRFToken(page);

      // Submit form
      if (selectors.submit) {
        await page.locator(selectors.submit).first().click();
      } else if (selectors.form) {
        // Try to submit the form directly
        await page.locator(selectors.form).first().press('Enter');
      } else {
        // Press Enter on password field
        await page.locator(selectors.password).first().press('Enter');
      }

      // Wait for navigation
      await page.waitForLoadState('domcontentloaded');

      // Small delay to allow redirects
      await page.waitForTimeout(500);

      // Check success
      return await this.detector.checkSuccess(page, config);
    } catch (error) {
      if (error instanceof LoginFormNotFoundError || error instanceof LoginUrlUnreachableError) {
        throw error;
      }
      // Don't expose credentials in error messages
      const safeMessage =
        error instanceof Error
          ? error.message.replace(credentials.identifier, '[IDENTIFIER]').replace(credentials.password, '[PASSWORD]')
          : 'Login failed';
      throw new AuthenticationError(safeMessage, 'form-login', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets selectors from config or auto-detects them.
   * Tracks attempted selectors for error reporting.
   */
  private async getSelectors(page: Page, config: LoginConfig): Promise<LoginSelectors | null> {
    const attemptedSelectors: string[] = [];

    // If selectors provided in config, validate and use them
    if (config.selectors) {
      // Track which configured selectors were attempted
      if (config.selectors.identifier) {
        attemptedSelectors.push(`identifier: ${config.selectors.identifier}`);
      }
      if (config.selectors.password) {
        attemptedSelectors.push(`password: ${config.selectors.password}`);
      }
      if (config.selectors.submit) {
        attemptedSelectors.push(`submit: ${config.selectors.submit}`);
      }

      const isValid = await this.detector.validateSelectors(page, config.selectors);
      if (isValid) {
        return config.selectors;
      }

      // Config selectors didn't work - fall through to auto-detect
      // but keep the attempted selectors for error message
    }

    // Auto-detect selectors
    const detected = await this.detector.detect(page);
    if (detected) {
      return detected;
    }

    // Both config and auto-detect failed - track for error
    if (attemptedSelectors.length === 0) {
      attemptedSelectors.push('(auto-detect attempted: password, email/username inputs)');
    }

    // Store attempted selectors for caller to use in error
    this.lastAttemptedSelectors = attemptedSelectors;
    return null;
  }

  /**
   * Last attempted selectors for error reporting.
   */
  private lastAttemptedSelectors: string[] = [];

  /**
   * Handles CSRF token if present in the form.
   */
  private async handleCSRFToken(_page: Page): Promise<void> {
    // CSRF tokens are usually included automatically in form submission
    // This method is a placeholder for any additional handling needed
    // No action needed - form submission includes hidden fields
  }

  /**
   * Detects CSRF token in page.
   * @param page - Page to search for CSRF token
   * @returns CSRF token value or null
   */
  async detectCSRFToken(page: Page): Promise<string | null> {
    const csrfSelectors = [
      'input[name="_token"]',
      'input[name="csrf_token"]',
      'input[name="csrfmiddlewaretoken"]',
      'input[name="_csrf"]',
      'input[name="authenticity_token"]',
      'meta[name="csrf-token"]',
    ];

    for (const selector of csrfSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const value = await element.getAttribute('value') || await element.getAttribute('content');
          if (value) {
            return value;
          }
        }
      } catch {
        // Continue to next selector
      }
    }

    return null;
  }
}

/**
 * Creates a FormLoginMethod instance.
 */
export function createFormLoginMethod(): FormLoginMethod {
  return new FormLoginMethod();
}
