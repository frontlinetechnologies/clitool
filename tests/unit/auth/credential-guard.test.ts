import { CredentialGuard, createCredentialGuard } from '../../../src/auth/credential-guard';
import { CredentialLeakError } from '../../../src/auth/errors';
import type { AuthConfig } from '../../../src/auth/types';

describe('CredentialGuard', () => {
  let guard: CredentialGuard;

  beforeEach(() => {
    guard = new CredentialGuard();
  });

  describe('addSecrets', () => {
    it('should add secrets to the guard', () => {
      guard.addSecrets(['password123', 'secret456']);
      expect(guard.getSecretCount()).toBe(2);
    });

    it('should ignore empty strings', () => {
      guard.addSecrets(['', '   ', 'valid']);
      expect(guard.getSecretCount()).toBe(1);
    });

    it('should ignore very short secrets (< 4 chars)', () => {
      guard.addSecrets(['abc', '12', 'validpass']);
      expect(guard.getSecretCount()).toBe(1);
    });
  });

  describe('redact', () => {
    it('should redact secrets from text', () => {
      guard.addSecrets(['password123']);
      const result = guard.redact('The password is password123');
      expect(result).toBe('The password is [REDACTED]');
    });

    it('should redact multiple occurrences', () => {
      guard.addSecrets(['secret']);
      const result = guard.redact('secret data with secret info');
      expect(result).toBe('[REDACTED] data with [REDACTED] info');
    });

    it('should redact multiple different secrets', () => {
      guard.addSecrets(['password123', 'apikey456']);
      const result = guard.redact('Creds: password123 and apikey456');
      expect(result).toBe('Creds: [REDACTED] and [REDACTED]');
    });

    it('should handle overlapping secrets by redacting longer first', () => {
      guard.addSecrets(['pass', 'password123']);
      const result = guard.redact('The password123 is set');
      expect(result).toBe('The [REDACTED] is set');
    });

    it('should handle special regex characters in secrets', () => {
      guard.addSecrets(['pass$word.123']);
      const result = guard.redact('Secret: pass$word.123');
      expect(result).toBe('Secret: [REDACTED]');
    });

    it('should return unchanged text when no secrets match', () => {
      guard.addSecrets(['secret123']);
      const result = guard.redact('No secrets here');
      expect(result).toBe('No secrets here');
    });

    it('should return empty string for empty input', () => {
      guard.addSecrets(['secret']);
      expect(guard.redact('')).toBe('');
    });

    it('should handle null-like values gracefully', () => {
      guard.addSecrets(['secret']);
      // @ts-expect-error Testing null handling
      expect(guard.redact(null)).toBe(null);
      // @ts-expect-error Testing undefined handling
      expect(guard.redact(undefined)).toBe(undefined);
    });
  });

  describe('validateNoLeaks', () => {
    it('should pass when no secrets are present', () => {
      guard.addSecrets(['secret123']);
      expect(guard.validateNoLeaks('Clean output')).toBe(true);
    });

    it('should throw CredentialLeakError when secret is detected', () => {
      guard.addSecrets(['secret123']);
      expect(() => guard.validateNoLeaks('Contains secret123')).toThrow(CredentialLeakError);
    });

    it('should include location in error message', () => {
      guard.addSecrets(['secret123']);
      try {
        guard.validateNoLeaks('secret123', 'log file');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CredentialLeakError);
        expect((error as CredentialLeakError).location).toBe('log file');
      }
    });

    it('should pass for empty output', () => {
      guard.addSecrets(['secret']);
      expect(guard.validateNoLeaks('')).toBe(true);
    });
  });

  describe('wrapLogger', () => {
    it('should wrap logger to redact secrets', () => {
      const logged: string[] = [];
      const logger = {
        info: (msg: string) => logged.push(msg),
        warn: (msg: string) => logged.push(msg),
        error: (msg: string) => logged.push(msg),
      };

      guard.addSecrets(['password123']);
      const wrappedLogger = guard.wrapLogger(logger);

      wrappedLogger.info('Login with password123');
      wrappedLogger.warn('Password is password123');
      wrappedLogger.error('Failed: password123');

      expect(logged).toEqual([
        'Login with [REDACTED]',
        'Password is [REDACTED]',
        'Failed: [REDACTED]',
      ]);
    });

    it('should redact secrets in object arguments', () => {
      const logged: unknown[] = [];
      const logger = {
        info: (_msg: string, ...args: unknown[]) => logged.push(...args),
        warn: () => {},
        error: () => {},
      };

      guard.addSecrets(['secret123']);
      const wrappedLogger = guard.wrapLogger(logger);

      wrappedLogger.info('Data:', { key: 'secret123' });

      expect(logged[0]).toEqual({ key: '[REDACTED]' });
    });
  });

  describe('createCredentialGuard with config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should load secrets from auth config env vars', () => {
      process.env.ADMIN_EMAIL = 'admin@example.com';
      process.env.ADMIN_PASSWORD = 'supersecret123';

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
      };

      const guard = createCredentialGuard(config);

      const redacted = guard.redact('Email: admin@example.com, Pass: supersecret123');
      expect(redacted).toBe('Email: [REDACTED], Pass: [REDACTED]');
    });

    it('should load tokens for token-injection auth', () => {
      process.env.API_TOKEN = 'Bearer abc123xyz';

      const config: AuthConfig = {
        roles: [
          {
            name: 'api-user',
            credentials: {
              identifierEnvVar: 'API_USER',
              passwordEnvVar: 'API_PASS',
            },
            authMethod: {
              type: 'token-injection',
              header: 'Authorization',
              tokenEnvVar: 'API_TOKEN',
            },
          },
        ],
      };

      const guard = createCredentialGuard(config);

      const redacted = guard.redact('Token: Bearer abc123xyz');
      expect(redacted).toBe('Token: [REDACTED]');
    });

    it('should load cookies from env var for cookie-injection auth', () => {
      process.env.SESSION_COOKIES = '[{"name":"session","value":"cookie_secret_123"}]';

      const config: AuthConfig = {
        roles: [
          {
            name: 'session-user',
            credentials: {
              identifierEnvVar: 'USER_EMAIL',
              passwordEnvVar: 'USER_PASS',
            },
            authMethod: {
              type: 'cookie-injection',
              cookies: { type: 'env-var', envVar: 'SESSION_COOKIES' },
            },
          },
        ],
      };

      const guard = createCredentialGuard(config);

      // Should redact both the raw JSON and individual cookie values
      expect(guard.redact('cookie_secret_123')).toBe('[REDACTED]');
    });

    it('should handle missing env vars gracefully', () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'user',
            credentials: {
              identifierEnvVar: 'NONEXISTENT_EMAIL',
              passwordEnvVar: 'NONEXISTENT_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
      };

      // Should not throw
      const guard = createCredentialGuard(config);
      expect(guard.getSecretCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all secrets', () => {
      guard.addSecrets(['secret1', 'secret2']);
      expect(guard.getSecretCount()).toBe(2);

      guard.clear();
      expect(guard.getSecretCount()).toBe(0);
    });
  });
});
