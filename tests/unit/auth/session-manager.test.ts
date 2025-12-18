/**
 * Unit tests for SessionManager.
 * Tests session state management and timeout detection.
 */

import { SessionManager } from '../../../src/auth/session-manager';
import type { SessionTimeoutConfig } from '../../../src/auth/types';

// Mock Playwright Response
const createMockResponse = (status: number, url = 'https://example.com/page') => ({
  status: () => status,
  url: () => url,
  ok: () => status >= 200 && status < 400,
});

// Mock Playwright Page
const createMockPage = (options: {
  currentUrl?: string;
  hasElement?: boolean;
} = {}) => ({
  url: jest.fn().mockReturnValue(options.currentUrl || 'https://example.com/page'),
  locator: jest.fn().mockReturnValue({
    count: jest.fn().mockResolvedValue(options.hasElement ? 1 : 0),
  }),
});

describe('SessionManager', () => {
  describe('constructor', () => {
    it('should create with default config', () => {
      const manager = new SessionManager();
      expect(manager).toBeInstanceOf(SessionManager);
    });

    it('should create with custom config', () => {
      const config: SessionTimeoutConfig = {
        expiryIndicators: [{ type: 'status-code', codes: [401] }],
        maxReauthAttempts: 5,
      };
      const manager = new SessionManager(config);
      expect(manager).toBeInstanceOf(SessionManager);
    });
  });

  describe('isSessionExpired', () => {
    it('should detect expiry from 401 status code', () => {
      const manager = new SessionManager();
      const response = createMockResponse(401);

      const expired = manager.isSessionExpired(response as any, 'https://example.com/login');
      expect(expired).toBe(true);
    });

    it('should detect expiry from 403 status code', () => {
      const manager = new SessionManager();
      const response = createMockResponse(403);

      const expired = manager.isSessionExpired(response as any, 'https://example.com/login');
      expect(expired).toBe(true);
    });

    it('should detect expiry from redirect to login URL', () => {
      const config: SessionTimeoutConfig = {
        expiryIndicators: [{ type: 'redirect-to-login' }],
        maxReauthAttempts: 3,
      };
      const manager = new SessionManager(config);
      const response = createMockResponse(200, 'https://example.com/login');

      const expired = manager.isSessionExpired(response as any, 'https://example.com/login');
      expect(expired).toBe(true);
    });

    it('should not flag valid session', () => {
      const manager = new SessionManager();
      const response = createMockResponse(200, 'https://example.com/dashboard');

      const expired = manager.isSessionExpired(response as any, 'https://example.com/login');
      expect(expired).toBe(false);
    });

    it('should handle custom status codes', () => {
      const config: SessionTimeoutConfig = {
        expiryIndicators: [{ type: 'status-code', codes: [418] }], // Custom code
        maxReauthAttempts: 3,
      };
      const manager = new SessionManager(config);
      const response = createMockResponse(418);

      const expired = manager.isSessionExpired(response as any, 'https://example.com/login');
      expect(expired).toBe(true);
    });
  });

  describe('checkPageForExpiry', () => {
    it('should detect login form element on page', async () => {
      const config: SessionTimeoutConfig = {
        expiryIndicators: [{ type: 'element-visible', selector: '#login-form' }],
        maxReauthAttempts: 3,
      };
      const manager = new SessionManager(config);
      const page = createMockPage({ hasElement: true });

      const expired = await manager.checkPageForExpiry(page as any);
      expect(expired).toBe(true);
    });

    it('should not detect expiry when element missing', async () => {
      const config: SessionTimeoutConfig = {
        expiryIndicators: [{ type: 'element-visible', selector: '#login-form' }],
        maxReauthAttempts: 3,
      };
      const manager = new SessionManager(config);
      const page = createMockPage({ hasElement: false });

      const expired = await manager.checkPageForExpiry(page as any);
      expect(expired).toBe(false);
    });

    it('should handle no expiry indicators configured', async () => {
      const config: SessionTimeoutConfig = {
        expiryIndicators: [],
        maxReauthAttempts: 3,
      };
      const manager = new SessionManager(config);
      const page = createMockPage();

      const expired = await manager.checkPageForExpiry(page as any);
      expect(expired).toBe(false);
    });
  });

  describe('recordReauthAttempt', () => {
    it('should track re-authentication attempts per role', () => {
      const manager = new SessionManager();

      expect(manager.recordReauthAttempt('admin')).toBe(1);
      expect(manager.recordReauthAttempt('admin')).toBe(2);
      expect(manager.recordReauthAttempt('user')).toBe(1);
      expect(manager.recordReauthAttempt('admin')).toBe(3);
    });

    it('should throw when max attempts exceeded', () => {
      const config: SessionTimeoutConfig = {
        expiryIndicators: [],
        maxReauthAttempts: 2,
      };
      const manager = new SessionManager(config);

      manager.recordReauthAttempt('admin');
      manager.recordReauthAttempt('admin');

      expect(() => manager.recordReauthAttempt('admin')).toThrow(
        'Maximum re-authentication attempts exceeded for role: admin',
      );
    });

    it('should use default max attempts of 3', () => {
      const manager = new SessionManager();

      manager.recordReauthAttempt('admin');
      manager.recordReauthAttempt('admin');
      manager.recordReauthAttempt('admin');

      expect(() => manager.recordReauthAttempt('admin')).toThrow();
    });
  });

  describe('resetReauthCounter', () => {
    it('should reset counter for specific role', () => {
      const manager = new SessionManager();

      manager.recordReauthAttempt('admin');
      manager.recordReauthAttempt('admin');
      manager.resetReauthCounter('admin');

      // Should be back to 1 after reset
      expect(manager.recordReauthAttempt('admin')).toBe(1);
    });

    it('should not affect other roles', () => {
      const manager = new SessionManager();

      manager.recordReauthAttempt('admin');
      manager.recordReauthAttempt('user');
      manager.resetReauthCounter('admin');

      // User counter should still be at 1, so next is 2
      expect(manager.recordReauthAttempt('user')).toBe(2);
    });

    it('should handle resetting non-existent role', () => {
      const manager = new SessionManager();

      // Should not throw
      expect(() => manager.resetReauthCounter('nonexistent')).not.toThrow();
    });
  });

  describe('getReauthAttempts', () => {
    it('should return current attempt count', () => {
      const manager = new SessionManager();

      expect(manager.getReauthAttempts('admin')).toBe(0);
      manager.recordReauthAttempt('admin');
      expect(manager.getReauthAttempts('admin')).toBe(1);
      manager.recordReauthAttempt('admin');
      expect(manager.getReauthAttempts('admin')).toBe(2);
    });
  });
});
