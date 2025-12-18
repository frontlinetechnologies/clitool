/**
 * Auth fixtures generator for Playwright tests.
 * Generates authentication fixtures that use environment variables for credentials.
 */

import type { AuthConfig, RoleConfig } from '../auth/types';

/**
 * Generator for Playwright authentication fixtures.
 * Ensures credentials are never hardcoded in test code.
 */
export class AuthFixturesGenerator {
  constructor(private readonly config: AuthConfig) {}

  /**
   * Generates TypeScript code for auth fixtures.
   * @returns Generated fixtures code
   */
  generateFixturesCode(): string {
    const lines: string[] = [];

    // Imports
    lines.push("import { test as base, BrowserContext } from '@playwright/test';");
    lines.push('');

    // Generate role types
    if (this.config.roles.length > 0) {
      lines.push('// Role-specific context types');
      lines.push('type AuthFixtures = {');
      for (const role of this.config.roles) {
        lines.push(`  ${this.toContextName(role.name)}: BrowserContext;`);
      }
      lines.push('};');
      lines.push('');
    }

    // Generate login helper if we have form-login roles
    const formLoginRoles = this.config.roles.filter(
      (r) => r.authMethod.type === 'form-login',
    );

    if (formLoginRoles.length > 0 && this.config.login?.url) {
      lines.push('/**');
      lines.push(' * Performs form-based login with the given credentials.');
      lines.push(' */');
      lines.push('async function performLogin(');
      lines.push('  context: BrowserContext,');
      lines.push('  identifier: string,');
      lines.push('  password: string,');
      lines.push(`  loginUrl = '${this.config.login.url}',`);
      lines.push('): Promise<void> {');
      lines.push('  const page = await context.newPage();');
      lines.push('  await page.goto(loginUrl);');
      lines.push('  ');

      // Use configured selectors if available
      if (this.config.login?.selectors) {
        const selectors = this.config.login.selectors;
        if (selectors.identifier) {
          lines.push(`  await page.locator('${selectors.identifier}').fill(identifier);`);
        } else {
          lines.push("  await page.locator('input[type=\"email\"], input[name=\"email\"], input[name=\"username\"]').first().fill(identifier);");
        }
        if (selectors.password) {
          lines.push(`  await page.locator('${selectors.password}').fill(password);`);
        } else {
          lines.push("  await page.locator('input[type=\"password\"]').fill(password);");
        }
        if (selectors.submit) {
          lines.push(`  await page.locator('${selectors.submit}').click();`);
        } else {
          lines.push("  await page.locator('button[type=\"submit\"], input[type=\"submit\"]').first().click();");
        }
      } else {
        lines.push("  await page.locator('input[type=\"email\"], input[name=\"email\"], input[name=\"username\"]').first().fill(identifier);");
        lines.push("  await page.locator('input[type=\"password\"]').fill(password);");
        lines.push("  await page.locator('button[type=\"submit\"], input[type=\"submit\"]').first().click();");
      }

      lines.push('  await page.waitForLoadState();');
      lines.push('  await page.close();');
      lines.push('}');
      lines.push('');
    }

    // Generate fixtures
    if (this.config.roles.length > 0) {
      lines.push('/**');
      lines.push(' * Extended test fixtures with authenticated contexts.');
      lines.push(' * Credentials are loaded from environment variables - never hardcode them!');
      lines.push(' */');
      lines.push('export const test = base.extend<AuthFixtures>({');

      for (const role of this.config.roles) {
        lines.push(...this.generateRoleFixture(role));
      }

      lines.push('});');
    } else {
      // Empty roles - just re-export base test
      lines.push('/**');
      lines.push(' * No authentication roles configured.');
      lines.push(' * Re-exporting base test for compatibility.');
      lines.push(' */');
      lines.push('export const test = base;');
    }

    lines.push('');
    lines.push('export { expect } from \'@playwright/test\';');

    return lines.join('\n');
  }

  /**
   * Generates fixture code for a single role.
   */
  private generateRoleFixture(role: RoleConfig): string[] {
    const lines: string[] = [];
    const contextName = this.toContextName(role.name);

    lines.push(`  ${contextName}: async ({ browser }, use) => {`);

    if (role.authMethod.type === 'storage-state' && role.authMethod.path) {
      // Storage state - just use the file
      lines.push(`    const context = await browser.newContext({`);
      lines.push(`      storageState: '${role.authMethod.path}',`);
      lines.push(`    });`);
    } else if (role.authMethod.type === 'form-login') {
      // Form login - use env vars
      const { identifierEnvVar, passwordEnvVar } = role.credentials;

      lines.push(`    // Get credentials from environment variables`);
      lines.push(`    const identifier = process.env.${identifierEnvVar};`);
      lines.push(`    const password = process.env.${passwordEnvVar};`);
      lines.push(`    `);
      lines.push(`    if (!identifier || !password) {`);
      lines.push(`      throw new Error(\`Missing credentials for ${role.name} role. Set ${identifierEnvVar} and ${passwordEnvVar} environment variables.\`);`);
      lines.push(`    }`);
      lines.push(`    `);
      lines.push(`    const context = await browser.newContext();`);
      lines.push(`    await performLogin(context, identifier, password);`);
    } else {
      // Unknown method - create empty context
      lines.push(`    const context = await browser.newContext();`);
    }

    lines.push(`    await use(context);`);
    lines.push(`    await context.close();`);
    lines.push(`  },`);
    lines.push('');

    return lines;
  }

  /**
   * Generates .env template for all roles.
   * @returns Environment variable template
   */
  generateEnvTemplate(): string {
    const lines: string[] = [];

    lines.push('# Authentication credentials for Playwright tests');
    lines.push('# WARNING: Never commit this file to version control!');
    lines.push('');

    for (const role of this.config.roles) {
      const { identifierEnvVar, passwordEnvVar } = role.credentials;
      const roleName = role.name.charAt(0).toUpperCase() + role.name.slice(1);

      lines.push(`# ${roleName} role credentials`);
      lines.push(`${identifierEnvVar}=`);
      lines.push(`${passwordEnvVar}=`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Gets list of required environment variables.
   * @returns Array of env var names
   */
  getRequiredEnvVars(): string[] {
    const vars = new Set<string>();

    for (const role of this.config.roles) {
      if (role.credentials.identifierEnvVar) {
        vars.add(role.credentials.identifierEnvVar);
      }
      if (role.credentials.passwordEnvVar) {
        vars.add(role.credentials.passwordEnvVar);
      }
    }

    return Array.from(vars);
  }

  /**
   * Converts role name to context fixture name.
   * e.g., "admin" -> "adminContext"
   */
  private toContextName(roleName: string): string {
    return `${roleName}Context`;
  }
}

/**
 * Creates an AuthFixturesGenerator instance.
 */
export function createAuthFixturesGenerator(config: AuthConfig): AuthFixturesGenerator {
  return new AuthFixturesGenerator(config);
}
