import { Authenticator, createAuthenticator } from '../../../src/auth/authenticator';
import type { AuthConfig } from '../../../src/auth/types';
import { CredentialsNotFoundError } from '../../../src/auth/errors';

// Mock Playwright types
const createMockPage = () => ({
  url: jest.fn().mockReturnValue('https://example.com/dashboard'),
  goto: jest.fn().mockResolvedValue({
    ok: () => true,
    status: () => 200,
    url: () => 'https://example.com/login',
  }),
  fill: jest.fn().mockResolvedValue(undefined),
  click: jest.fn().mockResolvedValue(undefined),
  waitForLoadState: jest.fn().mockResolvedValue(undefined),
  waitForTimeout: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  locator: jest.fn().mockReturnValue({
    count: jest.fn().mockResolvedValue(1),
    first: jest.fn().mockReturnValue({
      fill: jest.fn().mockResolvedValue(undefined),
      click: jest.fn().mockResolvedValue(undefined),
      press: jest.fn().mockResolvedValue(undefined),
      isVisible: jest.fn().mockResolvedValue(true),
    }),
  }),
  $: jest.fn().mockReturnValue({
    fill: jest.fn().mockResolvedValue(undefined),
    click: jest.fn().mockResolvedValue(undefined),
  }),
});

const createMockBrowser = () => {
  const mockPage = createMockPage();
  return {
    newContext: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue(mockPage),
      storageState: jest.fn().mockResolvedValue({ cookies: [], origins: [] }),
      close: jest.fn().mockResolvedValue(undefined),
      cookies: jest.fn().mockResolvedValue([{ name: 'session', value: 'abc' }]),
      pages: jest.fn().mockReturnValue([mockPage]),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  } as any;
};

describe('Authenticator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'adminpass123';
    process.env.USER_EMAIL = 'user@example.com';
    process.env.USER_PASSWORD = 'userpass123';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should create authenticator with valid config', () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      expect(auth).toBeInstanceOf(Authenticator);
    });
  });

  describe('authenticate', () => {
    it('should authenticate a role and return browser context', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      const context = await auth.authenticate('admin');

      expect(context).toBeDefined();
      expect(browser.newContext).toHaveBeenCalled();
    });

    it('should throw error for unknown role', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      await expect(auth.authenticate('unknown')).rejects.toThrow();
    });

    it('should throw CredentialsNotFoundError when env vars missing', async () => {
      delete process.env.ADMIN_EMAIL;
      delete process.env.ADMIN_PASSWORD;

      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      await expect(auth.authenticate('admin')).rejects.toThrow(CredentialsNotFoundError);
    });

    it('should log auth events', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      await auth.authenticate('admin');

      const events = auth.getAuthEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('login');
      expect(events[0].role).toBe('admin');
    });
  });

  describe('isSessionValid', () => {
    it('should check if session is still valid', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      await auth.authenticate('admin');

      const isValid = await auth.isSessionValid('admin');
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('getAuthEvents', () => {
    it('should return all auth events', async () => {
      const config: AuthConfig = {
        roles: [],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      const events = auth.getAuthEvents();

      expect(Array.isArray(events)).toBe(true);
    });

    it('should not contain credentials in events', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      await auth.authenticate('admin');

      const events = auth.getAuthEvents();
      const eventsJson = JSON.stringify(events);

      expect(eventsJson).not.toContain('adminpass123');
      expect(eventsJson).not.toContain('admin@example.com');
    });
  });

  describe('saveStorageState', () => {
    it('should save storage state to file', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      await auth.authenticate('admin');

      // Should not throw
      await expect(
        auth.saveStorageState('admin', '/tmp/test-state.json'),
      ).resolves.not.toThrow();
    });
  });

  describe('close', () => {
    it('should close all browser contexts', async () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const browser = createMockBrowser();
      const auth = new Authenticator(config, browser);

      await auth.authenticate('admin');
      await auth.close();

      // Should not throw on second close
      await expect(auth.close()).resolves.not.toThrow();
    });
  });
});

describe('createAuthenticator', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'adminpass123';
  });

  it('should create authenticator instance', () => {
    const config: AuthConfig = {
      roles: [],
    };

    const browser = createMockBrowser();
    const auth = createAuthenticator(config, browser);

    expect(auth).toBeInstanceOf(Authenticator);
  });
});
