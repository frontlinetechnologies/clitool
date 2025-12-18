/**
 * Unit tests for auth-fixtures generator.
 * Tests generation of authentication fixtures for Playwright tests.
 */

import {
  AuthFixturesGenerator,
  createAuthFixturesGenerator,
} from '../../../src/test-generation/auth-fixtures';
import type { AuthConfig } from '../../../src/auth/types';

describe('AuthFixturesGenerator', () => {
  describe('constructor', () => {
    it('should create with auth config', () => {
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

      const generator = new AuthFixturesGenerator(config);
      expect(generator).toBeInstanceOf(AuthFixturesGenerator);
    });

    it('should create with factory function', () => {
      const config: AuthConfig = { roles: [] };
      const generator = createAuthFixturesGenerator(config);
      expect(generator).toBeInstanceOf(AuthFixturesGenerator);
    });
  });

  describe('generateFixturesCode', () => {
    it('should generate fixtures for single role', () => {
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

      const generator = new AuthFixturesGenerator(config);
      const code = generator.generateFixturesCode();

      // Should include imports
      expect(code).toContain("import { test as base, BrowserContext }");
      expect(code).toContain("from '@playwright/test'");

      // Should include env var references
      expect(code).toContain('process.env.ADMIN_EMAIL');
      expect(code).toContain('process.env.ADMIN_PASSWORD');

      // Should not include hardcoded credentials
      expect(code).not.toContain('admin@example.com');

      // Should include fixture export
      expect(code).toContain('export const test');
      expect(code).toContain('adminContext');
    });

    it('should generate fixtures for multiple roles', () => {
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
          {
            name: 'user',
            credentials: {
              identifierEnvVar: 'USER_EMAIL',
              passwordEnvVar: 'USER_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
        login: { url: 'https://example.com/login' },
      };

      const generator = new AuthFixturesGenerator(config);
      const code = generator.generateFixturesCode();

      // Should include both roles
      expect(code).toContain('adminContext');
      expect(code).toContain('userContext');

      // Should include both role's env vars
      expect(code).toContain('process.env.ADMIN_EMAIL');
      expect(code).toContain('process.env.USER_EMAIL');
    });

    it('should generate storage state fixtures when path provided', () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'ADMIN_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: {
              type: 'storage-state',
              path: './auth-state/admin.json',
            },
          },
        ],
      };

      const generator = new AuthFixturesGenerator(config);
      const code = generator.generateFixturesCode();

      // Should reference storage state
      expect(code).toContain('storageState');
      expect(code).toContain('./auth-state/admin.json');
    });

    it('should handle empty roles array', () => {
      const config: AuthConfig = { roles: [] };

      const generator = new AuthFixturesGenerator(config);
      const code = generator.generateFixturesCode();

      // Should still be valid TypeScript
      expect(code).toContain('export const test');
    });
  });

  describe('generateEnvTemplate', () => {
    it('should generate .env template for all roles', () => {
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

      const generator = new AuthFixturesGenerator(config);
      const template = generator.generateEnvTemplate();

      // Should include all env vars
      expect(template).toContain('ADMIN_EMAIL=');
      expect(template).toContain('ADMIN_PASSWORD=');
      expect(template).toContain('USER_EMAIL=');
      expect(template).toContain('USER_PASSWORD=');

      // Should have placeholder values
      expect(template).toContain('# Admin role credentials');
      expect(template).toContain('# User role credentials');
    });
  });

  describe('getRequiredEnvVars', () => {
    it('should return list of required env vars', () => {
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

      const generator = new AuthFixturesGenerator(config);
      const envVars = generator.getRequiredEnvVars();

      expect(envVars).toContain('ADMIN_EMAIL');
      expect(envVars).toContain('ADMIN_PASSWORD');
      expect(envVars).toHaveLength(2);
    });

    it('should deduplicate env vars', () => {
      const config: AuthConfig = {
        roles: [
          {
            name: 'admin',
            credentials: {
              identifierEnvVar: 'SHARED_EMAIL',
              passwordEnvVar: 'ADMIN_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
          {
            name: 'user',
            credentials: {
              identifierEnvVar: 'SHARED_EMAIL',
              passwordEnvVar: 'USER_PASSWORD',
            },
            authMethod: { type: 'form-login' },
          },
        ],
      };

      const generator = new AuthFixturesGenerator(config);
      const envVars = generator.getRequiredEnvVars();

      // SHARED_EMAIL should only appear once
      expect(envVars.filter((v) => v === 'SHARED_EMAIL')).toHaveLength(1);
    });
  });
});
