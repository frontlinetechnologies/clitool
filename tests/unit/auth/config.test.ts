import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadAuthConfig,
  validateAuthConfig,
  createAuthConfigFromCLI,
  hasCredentialsInConfig,
} from '../../../src/auth/config';
import { AuthConfigError } from '../../../src/auth/errors';

describe('Auth Config', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-config-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('loadAuthConfig', () => {
    it('should load valid config from file', () => {
      const configPath = path.join(tempDir, 'auth.json');
      const config = {
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
        login: {
          url: 'https://example.com/login',
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      const loaded = loadAuthConfig(configPath);

      expect(loaded.roles).toHaveLength(1);
      expect(loaded.roles[0].name).toBe('admin');
      expect(loaded.login?.url).toBe('https://example.com/login');
    });

    it('should throw AuthConfigError when file not found', () => {
      expect(() => loadAuthConfig('/nonexistent/path.json')).toThrow(AuthConfigError);
    });

    it('should throw AuthConfigError for invalid JSON', () => {
      const configPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(configPath, '{ invalid json }');

      expect(() => loadAuthConfig(configPath)).toThrow(AuthConfigError);
    });
  });

  describe('validateAuthConfig', () => {
    it('should validate minimal valid config', () => {
      const config = {
        roles: [
          {
            name: 'user',
            credentials: {
              identifierEnvVar: 'USER_EMAIL',
              passwordEnvVar: 'USER_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
      };

      const validated = validateAuthConfig(config);

      expect(validated.roles).toHaveLength(1);
      expect(validated.roles[0].name).toBe('user');
    });

    it('should reject config without roles array', () => {
      expect(() => validateAuthConfig({})).toThrow(AuthConfigError);
      expect(() => validateAuthConfig({ roles: 'not-array' })).toThrow(AuthConfigError);
    });

    it('should reject role without name', () => {
      const config = {
        roles: [
          {
            credentials: {
              identifierEnvVar: 'EMAIL',
              passwordEnvVar: 'PASS',
            },
            authMethod: { type: 'form-login' },
          },
        ],
      };

      expect(() => validateAuthConfig(config)).toThrow(AuthConfigError);
    });

    it('should reject role with invalid name characters', () => {
      const config = {
        roles: [
          {
            name: 'invalid name with spaces',
            credentials: {
              identifierEnvVar: 'EMAIL',
              passwordEnvVar: 'PASS',
            },
            authMethod: { type: 'form-login' },
          },
        ],
      };

      expect(() => validateAuthConfig(config)).toThrow(AuthConfigError);
    });

    it('should accept role names with hyphens and underscores', () => {
      const config = {
        roles: [
          {
            name: 'super-admin_user',
            credentials: {
              identifierEnvVar: 'EMAIL',
              passwordEnvVar: 'PASS',
            },
            authMethod: { type: 'form-login' },
          },
        ],
      };

      const validated = validateAuthConfig(config);
      expect(validated.roles[0].name).toBe('super-admin_user');
    });

    it('should reject duplicate role names', () => {
      const config = {
        roles: [
          {
            name: 'admin',
            credentials: { identifierEnvVar: 'A_EMAIL', passwordEnvVar: 'A_PASS' },
            authMethod: { type: 'form-login' },
          },
          {
            name: 'admin',
            credentials: { identifierEnvVar: 'B_EMAIL', passwordEnvVar: 'B_PASS' },
            authMethod: { type: 'form-login' },
          },
        ],
      };

      expect(() => validateAuthConfig(config)).toThrow(/Duplicate role name/);
    });

    it('should reject role without credentials', () => {
      const config = {
        roles: [
          {
            name: 'user',
            authMethod: { type: 'form-login' },
          },
        ],
      };

      expect(() => validateAuthConfig(config)).toThrow(AuthConfigError);
    });

    it('should reject role without authMethod', () => {
      const config = {
        roles: [
          {
            name: 'user',
            credentials: { identifierEnvVar: 'EMAIL', passwordEnvVar: 'PASS' },
          },
        ],
      };

      expect(() => validateAuthConfig(config)).toThrow(AuthConfigError);
    });

    it('should validate all auth method types', () => {
      const methods = [
        { type: 'form-login' },
        { type: 'cookie-injection', cookies: { type: 'env-var', envVar: 'COOKIES' } },
        { type: 'cookie-injection', cookies: { type: 'file', path: './cookies.json' } },
        { type: 'token-injection', header: 'Authorization', tokenEnvVar: 'TOKEN' },
        { type: 'storage-state', path: './state.json' },
        { type: 'custom-script', scriptPath: './login.ts' },
      ];

      for (const method of methods) {
        const config = {
          roles: [
            {
              name: 'user',
              credentials: { identifierEnvVar: 'EMAIL', passwordEnvVar: 'PASS' },
              authMethod: method,
            },
          ],
        };

        expect(() => validateAuthConfig(config)).not.toThrow();
      }
    });

    it('should reject invalid auth method type', () => {
      const config = {
        roles: [
          {
            name: 'user',
            credentials: { identifierEnvVar: 'EMAIL', passwordEnvVar: 'PASS' },
            authMethod: { type: 'invalid-method' },
          },
        ],
      };

      expect(() => validateAuthConfig(config)).toThrow(/invalid authMethod.type/);
    });

    it('should validate login config URL', () => {
      const config = {
        roles: [],
        login: { url: 'not-a-valid-url' },
      };

      expect(() => validateAuthConfig(config)).toThrow(/not a valid URL/);
    });

    it('should validate login success indicators', () => {
      const config = {
        roles: [],
        login: {
          url: 'https://example.com/login',
          successIndicators: [
            { type: 'url-pattern', pattern: '/dashboard' },
            { type: 'element-visible', selector: '.welcome' },
            { type: 'element-hidden', selector: '.login-form' },
            { type: 'cookie-present', name: 'session' },
            { type: 'cookie-absent', name: 'needs-login' },
          ],
        },
      };

      const validated = validateAuthConfig(config);
      expect(validated.login?.successIndicators).toHaveLength(5);
    });

    it('should reject invalid success indicator type', () => {
      const config = {
        roles: [],
        login: {
          url: 'https://example.com/login',
          successIndicators: [{ type: 'invalid-type' }],
        },
      };

      expect(() => validateAuthConfig(config)).toThrow(/invalid type/);
    });

    it('should validate privilegeLevel as positive integer', () => {
      const validConfig = {
        roles: [
          {
            name: 'admin',
            credentials: { identifierEnvVar: 'EMAIL', passwordEnvVar: 'PASS' },
            authMethod: { type: 'form-login' },
            privilegeLevel: 100,
          },
        ],
      };

      expect(() => validateAuthConfig(validConfig)).not.toThrow();

      const invalidConfig = {
        roles: [
          {
            name: 'admin',
            credentials: { identifierEnvVar: 'EMAIL', passwordEnvVar: 'PASS' },
            authMethod: { type: 'form-login' },
            privilegeLevel: -1,
          },
        ],
      };

      expect(() => validateAuthConfig(invalidConfig)).toThrow(/positive integer/);
    });
  });

  describe('createAuthConfigFromCLI', () => {
    it('should create config from minimal CLI options', () => {
      const config = createAuthConfigFromCLI({
        authRole: 'admin',
      });

      expect(config.roles).toHaveLength(1);
      expect(config.roles[0].name).toBe('admin');
      expect(config.roles[0].credentials.identifierEnvVar).toBe('ADMIN_EMAIL');
      expect(config.roles[0].credentials.passwordEnvVar).toBe('ADMIN_PASSWORD');
    });

    it('should create config with login URL', () => {
      const config = createAuthConfigFromCLI({
        authRole: 'user',
        loginUrl: 'https://example.com/login',
      });

      expect(config.login?.url).toBe('https://example.com/login');
    });

    it('should create config with custom selectors', () => {
      const config = createAuthConfigFromCLI({
        authRole: 'user',
        loginUrl: 'https://example.com/login',
        usernameSelector: '#email',
        passwordSelector: '#pass',
        submitSelector: '#login-btn',
      });

      expect(config.login?.selectors?.identifier).toBe('#email');
      expect(config.login?.selectors?.password).toBe('#pass');
      expect(config.login?.selectors?.submit).toBe('#login-btn');
    });

    it('should create config with success indicators', () => {
      const config = createAuthConfigFromCLI({
        authRole: 'user',
        loginUrl: 'https://example.com/login',
        authSuccessUrl: '/dashboard',
        authSuccessSelector: '.welcome-msg',
        authSuccessCookie: 'session',
      });

      expect(config.login?.successIndicators).toHaveLength(3);
      expect(config.login?.successIndicators?.[0]).toEqual({
        type: 'url-pattern',
        pattern: '/dashboard',
      });
    });

    it('should normalize role name', () => {
      const config = createAuthConfigFromCLI({
        authRole: 'Super Admin',
      });

      expect(config.roles[0].name).toBe('super-admin');
    });
  });

  describe('hasCredentialsInConfig', () => {
    it('should return false for config with only env var references', () => {
      const configPath = path.join(tempDir, 'safe.json');
      const config = {
        roles: [
          {
            name: 'user',
            credentials: {
              identifierEnvVar: 'USER_EMAIL',
              passwordEnvVar: 'USER_PASSWORD',
            },
          },
        ],
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(hasCredentialsInConfig(configPath)).toBe(false);
    });

    it('should return true for config with direct credential values', () => {
      const configPath = path.join(tempDir, 'unsafe.json');
      const config = {
        roles: [
          {
            name: 'user',
            credentials: {
              identifier: 'user@example.com',
              password: 'secret123',
            },
          },
        ],
      };

      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(hasCredentialsInConfig(configPath)).toBe(true);
    });

    it('should return false for non-existent file', () => {
      expect(hasCredentialsInConfig('/nonexistent/file.json')).toBe(false);
    });
  });
});
