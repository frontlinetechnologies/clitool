/**
 * Authenticator - Main orchestrator for authentication operations.
 * Handles role-based authentication and session management.
 */

import type { Browser, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import type { AuthConfig, RoleConfig, AuthEvent, AuthMethod } from './types';
import {
  AuthenticationError,
  CredentialsNotFoundError,
  StorageStateNotFoundError,
  LoginFormNotFoundError,
} from './errors';
import { CredentialGuard } from './credential-guard';
import { FormLoginMethod, LoginUrlUnreachableError } from './methods/form-login';

/**
 * Resolved credentials from environment.
 */
interface ResolvedCredentials {
  identifier: string;
  password: string;
}

/**
 * Storage state format from Playwright.
 */
interface StorageState {
  cookies?: Array<{
    name: string;
    value: string;
    url?: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  origins?: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Main authentication orchestrator.
 */
export class Authenticator {
  private config: AuthConfig;
  private browser: Browser;
  private contexts: Map<string, BrowserContext> = new Map();
  private authEvents: AuthEvent[] = [];
  private credentialGuard: CredentialGuard;
  private formLoginMethod: FormLoginMethod;

  /**
   * Creates an authenticator from config.
   * @param config - Authentication configuration
   * @param browser - Playwright browser instance
   */
  constructor(config: AuthConfig, browser: Browser) {
    this.config = config;
    this.browser = browser;
    this.credentialGuard = new CredentialGuard(config);
    this.formLoginMethod = new FormLoginMethod();
  }

  /**
   * Authenticates a specific role and returns browser context.
   * @param roleName - Name of role to authenticate
   * @returns Authenticated browser context
   * @throws AuthenticationError if authentication fails
   */
  async authenticate(roleName: string): Promise<BrowserContext> {
    const startTime = Date.now();

    // Find role config
    const roleConfig = this.config.roles.find((r) => r.name === roleName);
    if (!roleConfig) {
      throw new AuthenticationError(`Role '${roleName}' not found in configuration`, roleName);
    }

    try {
      // Check if we already have a context
      const existingContext = this.contexts.get(roleName);
      if (existingContext) {
        return existingContext;
      }

      // Create new context
      const context = await this.browser.newContext();

      // Authenticate based on auth method
      await this.performAuthentication(context, roleConfig);

      // Store context
      this.contexts.set(roleName, context);

      // Log success event
      this.logAuthEvent({
        type: 'login',
        role: roleName,
        success: true,
        durationMs: Date.now() - startTime,
      });

      return context;
    } catch (error) {
      // Log failure event
      this.logAuthEvent({
        type: 'login',
        role: roleName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });

      // Pass through specific auth errors without wrapping
      if (
        error instanceof AuthenticationError ||
        error instanceof CredentialsNotFoundError ||
        error instanceof LoginFormNotFoundError ||
        error instanceof LoginUrlUnreachableError ||
        error instanceof StorageStateNotFoundError
      ) {
        throw error;
      }

      throw new AuthenticationError(
        error instanceof Error ? error.message : 'Authentication failed',
        roleName,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Performs authentication based on the configured method.
   */
  private async performAuthentication(context: BrowserContext, roleConfig: RoleConfig): Promise<void> {
    const { authMethod } = roleConfig;

    switch (authMethod.type) {
      case 'form-login':
        await this.performFormLogin(context, roleConfig);
        break;

      case 'storage-state':
        await this.applyStorageState(context, authMethod.path);
        break;

      case 'cookie-injection':
        // Will be implemented in Phase 6
        throw new AuthenticationError(
          'Cookie injection not yet implemented',
          roleConfig.name,
        );

      case 'token-injection':
        // Will be implemented in Phase 6
        throw new AuthenticationError(
          'Token injection not yet implemented',
          roleConfig.name,
        );

      case 'custom-script':
        // Will be implemented in Phase 7
        throw new AuthenticationError(
          'Custom script not yet implemented',
          roleConfig.name,
        );

      default:
        throw new AuthenticationError(
          `Unknown auth method: ${(authMethod as AuthMethod).type}`,
          roleConfig.name,
        );
    }
  }

  /**
   * Performs form-based login.
   */
  private async performFormLogin(context: BrowserContext, roleConfig: RoleConfig): Promise<void> {
    if (!this.config.login) {
      throw new AuthenticationError(
        'Login configuration required for form-login method',
        roleConfig.name,
      );
    }

    // Resolve credentials from environment
    const credentials = this.resolveCredentials(roleConfig);

    // Perform login
    const success = await this.formLoginMethod.login(context, this.config.login, credentials);

    if (!success) {
      throw new AuthenticationError('Login form submission failed', roleConfig.name);
    }
  }

  /**
   * Applies storage state from file to context.
   */
  private async applyStorageState(context: BrowserContext, statePath: string): Promise<void> {
    const absolutePath = path.resolve(statePath);

    if (!fs.existsSync(absolutePath)) {
      throw new StorageStateNotFoundError(statePath);
    }

    // Read and apply storage state
    const stateContent = fs.readFileSync(absolutePath, 'utf-8');
    const state = JSON.parse(stateContent) as StorageState;

    // Apply cookies
    if (state.cookies && Array.isArray(state.cookies)) {
      await context.addCookies(state.cookies);
    }

    // Apply localStorage via page
    if (state.origins && Array.isArray(state.origins)) {
      const page = await context.newPage();
      for (const origin of state.origins) {
        if (origin.origin && origin.localStorage) {
          await page.goto(origin.origin);
          for (const item of origin.localStorage) {
            const key = item.name;
            const value = item.value;
            await page.evaluate(
              `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)})`,
            );
          }
        }
      }
      await page.close();
    }
  }

  /**
   * Resolves credentials from environment variables.
   */
  private resolveCredentials(roleConfig: RoleConfig): ResolvedCredentials {
    const { credentials } = roleConfig;
    const identifier = process.env[credentials.identifierEnvVar];
    const password = process.env[credentials.passwordEnvVar];

    const missingVars: string[] = [];
    if (!identifier) {
      missingVars.push(credentials.identifierEnvVar);
    }
    if (!password) {
      missingVars.push(credentials.passwordEnvVar);
    }

    if (missingVars.length > 0) {
      throw new CredentialsNotFoundError(roleConfig.name, missingVars);
    }

    // Add to credential guard for redaction
    this.credentialGuard.addSecrets([identifier!, password!]);

    return { identifier: identifier!, password: password! };
  }

  /**
   * Checks if session is still valid for a role.
   * @param roleName - Name of role to check
   * @returns true if session is valid
   */
  async isSessionValid(roleName: string): Promise<boolean> {
    const context = this.contexts.get(roleName);
    if (!context) {
      return false;
    }

    // Check if context has cookies
    const cookies = await context.cookies();
    return cookies.length > 0;
  }

  /**
   * Re-authenticates a role (used on session timeout).
   * @param roleName - Name of role to re-authenticate
   * @returns Fresh browser context
   * @emits AuthEvent with type 're-auth'
   */
  async reAuthenticate(roleName: string): Promise<BrowserContext> {
    const startTime = Date.now();

    // Close existing context
    const existingContext = this.contexts.get(roleName);
    if (existingContext) {
      await existingContext.close();
      this.contexts.delete(roleName);
    }

    try {
      // Re-authenticate
      const context = await this.authenticate(roleName);

      // Log re-auth event (authenticate already logged login)
      this.logAuthEvent({
        type: 're-auth',
        role: roleName,
        success: true,
        durationMs: Date.now() - startTime,
      });

      return context;
    } catch (error) {
      this.logAuthEvent({
        type: 're-auth',
        role: roleName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Logs out a specific role.
   * @param roleName - Name of role to log out
   * @emits AuthEvent with type 'logout'
   */
  async logout(roleName: string): Promise<void> {
    const context = this.contexts.get(roleName);
    if (context) {
      await context.close();
      this.contexts.delete(roleName);

      this.logAuthEvent({
        type: 'logout',
        role: roleName,
        success: true,
      });
    }
  }

  /**
   * Gets all authentication events that occurred.
   * @returns Array of auth events (credentials redacted)
   */
  getAuthEvents(): AuthEvent[] {
    return this.authEvents.map((event) => ({
      ...event,
      // Ensure error messages are redacted
      error: event.error ? this.credentialGuard.redact(event.error) : undefined,
    }));
  }

  /**
   * Saves storage state for a role to file.
   * @param roleName - Name of role
   * @param filePath - File path to save state
   */
  async saveStorageState(roleName: string, filePath: string): Promise<void> {
    const context = this.contexts.get(roleName);
    if (!context) {
      throw new AuthenticationError(`No authenticated context for role '${roleName}'`, roleName);
    }

    const absolutePath = path.resolve(filePath);
    const dirPath = path.dirname(absolutePath);

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Save storage state
    await context.storageState({ path: absolutePath });
  }

  /**
   * Gets the browser context for a role.
   * @param roleName - Name of role
   * @returns Browser context or undefined
   */
  getContext(roleName: string): BrowserContext | undefined {
    return this.contexts.get(roleName);
  }

  /**
   * Closes all browser contexts and cleans up.
   */
  async close(): Promise<void> {
    for (const [roleName, context] of this.contexts) {
      try {
        await context.close();
      } catch {
        // Ignore close errors
      }
      this.contexts.delete(roleName);
    }
  }

  /**
   * Logs an auth event.
   */
  private logAuthEvent(event: Omit<AuthEvent, 'timestamp'>): void {
    this.authEvents.push({
      ...event,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Creates an Authenticator from config.
 */
export function createAuthenticator(config: AuthConfig, browser: Browser): Authenticator {
  return new Authenticator(config, browser);
}
