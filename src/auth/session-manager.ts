/**
 * SessionManager - Manages session state and detects timeouts.
 * Tracks re-authentication attempts and detects session expiry.
 */

import type { Page, Response } from 'playwright';
import type { SessionTimeoutConfig, ExpiryIndicator } from './types';
import { createDefaultSessionTimeoutConfig } from './types';

/**
 * Manages session state and detects timeouts.
 */
export class SessionManager {
  private config: SessionTimeoutConfig;
  private reauthAttempts: Map<string, number> = new Map();

  /**
   * Creates session manager with timeout config.
   * @param config - Session timeout configuration
   */
  constructor(config?: SessionTimeoutConfig) {
    this.config = config || createDefaultSessionTimeoutConfig();
  }

  /**
   * Checks if a response indicates session expiry.
   * @param response - Playwright response object
   * @param loginUrl - Login URL for redirect detection
   * @returns true if session has expired
   */
  isSessionExpired(response: Response, loginUrl: string): boolean {
    const status = response.status();
    const responseUrl = response.url();

    for (const indicator of this.config.expiryIndicators) {
      if (this.checkExpiryIndicator(indicator, status, responseUrl, loginUrl)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks a single expiry indicator against response.
   */
  private checkExpiryIndicator(
    indicator: ExpiryIndicator,
    status: number,
    responseUrl: string,
    loginUrl: string,
  ): boolean {
    switch (indicator.type) {
      case 'status-code':
        return indicator.codes.includes(status);

      case 'redirect-to-login':
        return this.isLoginRedirect(responseUrl, loginUrl);

      case 'element-visible':
        // Can't check element visibility from response alone
        // This needs to be checked via checkPageForExpiry
        return false;

      default:
        return false;
    }
  }

  /**
   * Checks if URL indicates redirect to login page.
   */
  private isLoginRedirect(responseUrl: string, loginUrl: string): boolean {
    try {
      const response = new URL(responseUrl);
      const login = new URL(loginUrl);

      // Check if paths match (ignoring query params)
      return response.pathname === login.pathname && response.hostname === login.hostname;
    } catch {
      // Invalid URL - try simple string comparison
      return responseUrl.includes(loginUrl) || loginUrl.includes(responseUrl);
    }
  }

  /**
   * Checks if page state indicates session expiry.
   * @param page - Playwright page object
   * @returns true if session appears expired
   */
  async checkPageForExpiry(page: Page): Promise<boolean> {
    for (const indicator of this.config.expiryIndicators) {
      if (indicator.type === 'element-visible') {
        try {
          const count = await page.locator(indicator.selector).count();
          if (count > 0) {
            return true;
          }
        } catch {
          // Selector failed - continue checking
        }
      }
    }

    return false;
  }

  /**
   * Records a re-authentication attempt.
   * @param roleName - Role that was re-authenticated
   * @returns Current attempt count
   * @throws Error if max attempts exceeded
   */
  recordReauthAttempt(roleName: string): number {
    const maxAttempts = this.config.maxReauthAttempts ?? 3;
    const currentAttempts = this.reauthAttempts.get(roleName) ?? 0;
    const newAttempts = currentAttempts + 1;

    if (newAttempts > maxAttempts) {
      throw new Error(`Maximum re-authentication attempts exceeded for role: ${roleName}`);
    }

    this.reauthAttempts.set(roleName, newAttempts);
    return newAttempts;
  }

  /**
   * Resets re-auth counter for a role (on successful page load).
   * @param roleName - Role to reset
   */
  resetReauthCounter(roleName: string): void {
    this.reauthAttempts.delete(roleName);
  }

  /**
   * Gets the current re-auth attempt count for a role.
   * @param roleName - Role to check
   * @returns Current attempt count
   */
  getReauthAttempts(roleName: string): number {
    return this.reauthAttempts.get(roleName) ?? 0;
  }

  /**
   * Gets the configured max re-auth attempts.
   */
  getMaxReauthAttempts(): number {
    return this.config.maxReauthAttempts ?? 3;
  }
}

/**
 * Creates a SessionManager instance.
 */
export function createSessionManager(config?: SessionTimeoutConfig): SessionManager {
  return new SessionManager(config);
}
