/**
 * LoginDetector - Auto-detects login forms on web pages.
 * Uses heuristic-based detection with configurable fallback selectors.
 */

import type { Page } from 'playwright';
import type { LoginConfig, LoginSelectors, SuccessIndicator } from './types';

/**
 * Detection heuristics for login form elements.
 */
const DETECTION_HEURISTICS = {
  passwordSelectors: [
    'input[type="password"]',
    '#password',
    '#pass',
    'input[name="password"]',
    'input[name="pass"]',
    '[data-testid*="password"]',
    '[aria-label*="password" i]',
  ],
  identifierSelectors: [
    'input[type="email"]',
    '#email',
    '#username',
    '#user',
    'input[name="email"]',
    'input[name="username"]',
    'input[name="user"]',
    'input[name="login"]',
    'input[type="text"][autocomplete="email"]',
    'input[type="text"][autocomplete="username"]',
    '[data-testid*="email"]',
    '[data-testid*="username"]',
    '[aria-label*="email" i]',
    '[aria-label*="username" i]',
  ],
  submitSelectors: [
    'button[type="submit"]',
    '#login-button',
    '#login-btn',
    '#submit',
    'button:has-text("Sign in")',
    'button:has-text("Log in")',
    'button:has-text("Login")',
    'input[type="submit"]',
    '[data-testid*="login"]',
    '[data-testid*="submit"]',
  ],
  formSelectors: [
    'form#login',
    'form#signin',
    'form.login-form',
    'form.signin-form',
    'form[action*="login"]',
    'form[action*="signin"]',
    '[data-testid*="login-form"]',
  ],
};

/**
 * Auto-detects login forms on a page.
 */
export class LoginDetector {
  /**
   * Detects login form elements on a page.
   * @param page - Playwright page at login URL
   * @returns Detected selectors or null if not found
   */
  async detect(page: Page): Promise<LoginSelectors | null> {
    // First, find password field (required)
    const passwordSelector = await this.findFirstMatch(page, DETECTION_HEURISTICS.passwordSelectors);
    if (!passwordSelector) {
      return null;
    }

    // Find identifier field
    const identifierSelector = await this.findFirstMatch(
      page,
      DETECTION_HEURISTICS.identifierSelectors,
    );

    // Find submit button
    const submitSelector = await this.findFirstMatch(page, DETECTION_HEURISTICS.submitSelectors);

    // Find form (optional)
    const formSelector = await this.findFirstMatch(page, DETECTION_HEURISTICS.formSelectors);

    return {
      identifier: identifierSelector || undefined,
      password: passwordSelector,
      submit: submitSelector || undefined,
      form: formSelector || undefined,
    };
  }

  /**
   * Validates that detected/configured selectors work.
   * @param page - Playwright page
   * @param selectors - Selectors to validate
   * @returns true if required selectors find elements
   */
  async validateSelectors(page: Page, selectors: LoginSelectors): Promise<boolean> {
    // Password is required
    if (!selectors.password) {
      return false;
    }

    const passwordExists = await this.selectorExists(page, selectors.password);
    if (!passwordExists) {
      return false;
    }

    // Identifier is required if specified
    if (selectors.identifier) {
      const identifierExists = await this.selectorExists(page, selectors.identifier);
      if (!identifierExists) {
        return false;
      }
    }

    // Submit is optional
    if (selectors.submit) {
      const submitExists = await this.selectorExists(page, selectors.submit);
      if (!submitExists) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if login was successful based on config indicators.
   * @param page - Page after login attempt
   * @param config - Login configuration with success indicators
   * @returns true if login appears successful
   */
  async checkSuccess(page: Page, config: LoginConfig): Promise<boolean> {
    const indicators = config.successIndicators;

    // If no indicators configured, check if URL changed from login page
    if (!indicators || indicators.length === 0) {
      const currentUrl = page.url();
      return !currentUrl.includes(new URL(config.url).pathname);
    }

    // Check each indicator - any passing is success
    for (const indicator of indicators) {
      const passed = await this.checkIndicator(page, indicator);
      if (passed) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks a single success indicator.
   */
  private async checkIndicator(page: Page, indicator: SuccessIndicator): Promise<boolean> {
    switch (indicator.type) {
      case 'url-pattern':
        return page.url().includes(indicator.pattern);

      case 'element-visible':
        return this.selectorExists(page, indicator.selector);

      case 'element-hidden':
        return !(await this.selectorExists(page, indicator.selector));

      case 'cookie-present':
        // Would need browser context to check cookies
        // For now, return false as we can't check this without context
        return false;

      case 'cookie-absent':
        return false;

      default:
        return false;
    }
  }

  /**
   * Finds first matching selector from a list.
   */
  private async findFirstMatch(page: Page, selectors: string[]): Promise<string | null> {
    for (const selector of selectors) {
      try {
        const exists = await this.selectorExists(page, selector);
        if (exists) {
          return selector;
        }
      } catch {
        // Selector may be invalid for this page, continue
      }
    }
    return null;
  }

  /**
   * Checks if a selector finds at least one element.
   */
  private async selectorExists(page: Page, selector: string): Promise<boolean> {
    try {
      const count = await page.locator(selector).count();
      return count > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Creates a LoginDetector instance.
 */
export function createLoginDetector(): LoginDetector {
  return new LoginDetector();
}
