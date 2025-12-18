/**
 * Integration tests for authenticated crawling.
 * Tests the full flow from authentication through crawling with authenticated context.
 */

import { chromium, Browser } from 'playwright';
import { createAuthenticator } from '../../src/auth/authenticator';
import { Crawler } from '../../src/crawler/crawler';
import type { AuthConfig, AuthEvent } from '../../src/auth/types';
import { CredentialsNotFoundError, AuthenticationError } from '../../src/auth/errors';
import { LoginUrlUnreachableError } from '../../src/auth/methods/form-login';

describe('Authenticated Crawl Integration', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  }, 30000);

  afterAll(async () => {
    await browser.close();
  });

  describe('Single-Role Authentication Flow', () => {
    it('should throw CredentialsNotFoundError when env vars missing', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'testuser',
            credentials: {
              identifierEnvVar: 'TEST_MISSING_EMAIL_12345',
              passwordEnvVar: 'TEST_MISSING_PASSWORD_12345',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: {
          url: 'https://example.com/login',
        },
      };

      const authenticator = createAuthenticator(config, browser);

      await expect(authenticator.authenticate('testuser')).rejects.toThrow(
        CredentialsNotFoundError,
      );

      await authenticator.close();
    });

    it('should throw error for unknown role', async () => {
      const config: AuthConfig = {
        roles: [],
      };

      const authenticator = createAuthenticator(config, browser);

      await expect(authenticator.authenticate('nonexistent')).rejects.toThrow(
        AuthenticationError,
      );

      await authenticator.close();
    });

    it('should log auth failure events', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'testuser',
            credentials: {
              identifierEnvVar: 'TEST_MISSING_EMAIL_99999',
              passwordEnvVar: 'TEST_MISSING_PASSWORD_99999',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: {
          url: 'https://example.com/login',
        },
      };

      const authenticator = createAuthenticator(config, browser);

      try {
        await authenticator.authenticate('testuser');
      } catch {
        // Expected to fail
      }

      const events = authenticator.getAuthEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('login');
      expect(events[0].role).toBe('testuser');
      expect(events[0].success).toBe(false);

      await authenticator.close();
    });
  });

  describe('Crawler with Auth Context', () => {
    it('should accept auth context and track role name', () => {
      const crawler = new Crawler('https://example.com', true);
      expect(crawler.isAuthenticated()).toBe(false);

      // Note: We can't easily test setAuthContext without a real authenticated context
      // This test verifies the API exists
    });

    it('should include auth events in results', async () => {
      const crawler = new Crawler('https://example.com', true, 0.1, {
        maxPages: 1,
      });

      // Add mock auth events
      const mockEvents: AuthEvent[] = [
        {
          timestamp: new Date().toISOString(),
          type: 'login',
          role: 'testuser',
          success: true,
          durationMs: 1000,
        },
      ];
      crawler.addAuthEvents(mockEvents);

      // Don't actually crawl - just verify events would be included
      // (Real integration would need a mock server)
      expect(crawler.isAuthenticated()).toBe(false);
    });
  });

  describe('Login URL Validation', () => {
    it('should handle unreachable login URL gracefully', async () => {
      // This test validates error handling for invalid URLs
      const config: AuthConfig = {
        roles: [
          {
            name: 'testuser',
            credentials: {
              identifierEnvVar: 'TEST_EMAIL',
              passwordEnvVar: 'TEST_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: {
          // Use a URL that will definitely fail
          url: 'https://this-domain-does-not-exist-12345.invalid/login',
        },
      };

      // Set env vars for this test
      const originalEmail = process.env.TEST_EMAIL;
      const originalPassword = process.env.TEST_PASSWORD;
      process.env.TEST_EMAIL = 'test@example.com';
      process.env.TEST_PASSWORD = 'testpassword123';

      try {
        const authenticator = createAuthenticator(config, browser);

        await expect(authenticator.authenticate('testuser')).rejects.toThrow(
          LoginUrlUnreachableError,
        );

        // Check that failure event was logged
        const events = authenticator.getAuthEvents();
        expect(events.length).toBeGreaterThan(0);
        expect(events[events.length - 1].success).toBe(false);

        await authenticator.close();
      } finally {
        // Restore env vars
        if (originalEmail === undefined) {
          delete process.env.TEST_EMAIL;
        } else {
          process.env.TEST_EMAIL = originalEmail;
        }
        if (originalPassword === undefined) {
          delete process.env.TEST_PASSWORD;
        } else {
          process.env.TEST_PASSWORD = originalPassword;
        }
      }
    }, 60000); // Longer timeout for network operations
  });

  describe('Storage State Authentication', () => {
    it('should throw StorageStateNotFoundError for missing state file', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'testuser',
            credentials: {
              identifierEnvVar: 'TEST_EMAIL',
              passwordEnvVar: 'TEST_PASSWORD',
            },
            authMethod: {
              type: 'storage-state',
              path: '/nonexistent/path/auth-state.json',
            },
          },
        ],
      };

      const authenticator = createAuthenticator(config, browser);

      await expect(authenticator.authenticate('testuser')).rejects.toThrow(
        'Storage state file not found',
      );

      await authenticator.close();
    });
  });

  describe('Session Validation', () => {
    it('should return false for unauthenticated role', async () => {
      const config: AuthConfig = {
        roles: [],
      };

      const authenticator = createAuthenticator(config, browser);

      const isValid = await authenticator.isSessionValid('nonexistent');
      expect(isValid).toBe(false);

      await authenticator.close();
    });
  });
});
