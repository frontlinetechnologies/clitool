/**
 * CredentialGuard - Prevents credential leakage in all outputs.
 * Wraps loggers and validates outputs to ensure no secrets appear.
 */

import type { AuthConfig } from './types';
import { CredentialLeakError } from './errors';

/**
 * Logger interface for wrapping.
 */
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug?(message: string, ...args: unknown[]): void;
}

/**
 * Prevents credential leakage in all outputs.
 */
export class CredentialGuard {
  private secrets: Set<string> = new Set();
  private readonly redactionPlaceholder = '[REDACTED]';

  /**
   * Creates a CredentialGuard from auth config.
   * Automatically registers credential values from environment variables.
   */
  constructor(config?: AuthConfig) {
    if (config) {
      this.loadSecretsFromConfig(config);
    }
  }

  /**
   * Loads secrets from auth config by resolving env vars.
   */
  private loadSecretsFromConfig(config: AuthConfig): void {
    for (const role of config.roles) {
      const { credentials, authMethod } = role;

      // Load credentials from env vars
      if (credentials) {
        const identifier = process.env[credentials.identifierEnvVar];
        const password = process.env[credentials.passwordEnvVar];

        if (identifier) {
          this.addSecrets([identifier]);
        }
        if (password) {
          this.addSecrets([password]);
        }
      }

      // Load tokens from env vars for token injection
      if (authMethod.type === 'token-injection') {
        const token = process.env[authMethod.tokenEnvVar];
        if (token) {
          this.addSecrets([token]);
        }
      }

      // Load cookies from env vars for cookie injection
      if (authMethod.type === 'cookie-injection' && authMethod.cookies.type === 'env-var') {
        const cookiesJson = process.env[authMethod.cookies.envVar];
        if (cookiesJson) {
          // Add the raw JSON string as a secret
          this.addSecrets([cookiesJson]);
          // Also try to extract cookie values
          try {
            const cookies = JSON.parse(cookiesJson) as Array<{ value?: string }>;
            for (const cookie of cookies) {
              if (cookie.value) {
                this.addSecrets([cookie.value]);
              }
            }
          } catch {
            // Ignore parse errors - the raw string is already added
          }
        }
      }
    }
  }

  /**
   * Registers additional secrets to redact.
   */
  addSecrets(secrets: string[]): void {
    for (const secret of secrets) {
      if (secret && secret.length >= 4) {
        // Only add non-trivial secrets
        this.secrets.add(secret);
      }
    }
  }

  /**
   * Redacts all known secrets from text.
   * Replaces each secret with [REDACTED].
   */
  redact(text: string): string {
    if (!text || this.secrets.size === 0) {
      return text;
    }

    let result = text;

    // Sort secrets by length (longest first) to avoid partial matches
    const sortedSecrets = [...this.secrets].sort((a, b) => b.length - a.length);

    for (const secret of sortedSecrets) {
      // Escape regex special characters in the secret
      const escapedSecret = secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escapedSecret, 'g'), this.redactionPlaceholder);
    }

    return result;
  }

  /**
   * Wraps a logger to auto-redact all output.
   */
  wrapLogger<T extends Logger>(logger: T): T {
    const self = this;

    const wrap =
      (fn: (message: string, ...args: unknown[]) => void) =>
      (message: string, ...args: unknown[]): void => {
        const redactedMessage = self.redact(message);
        const redactedArgs = args.map((arg) => {
          if (typeof arg === 'string') {
            return self.redact(arg);
          }
          if (typeof arg === 'object' && arg !== null) {
            return JSON.parse(self.redact(JSON.stringify(arg)));
          }
          return arg;
        });
        fn.call(logger, redactedMessage, ...redactedArgs);
      };

    return {
      ...logger,
      info: wrap(logger.info.bind(logger)),
      warn: wrap(logger.warn.bind(logger)),
      error: wrap(logger.error.bind(logger)),
      debug: logger.debug ? wrap(logger.debug.bind(logger)) : undefined,
    } as T;
  }

  /**
   * Validates that output contains no secrets.
   * @throws CredentialLeakError if any secret is detected
   */
  validateNoLeaks(output: string, location = 'output'): boolean {
    if (!output || this.secrets.size === 0) {
      return true;
    }

    for (const secret of this.secrets) {
      if (output.includes(secret)) {
        throw new CredentialLeakError(
          `Credential detected in ${location}. Secret value was found in output.`,
          location,
        );
      }
    }

    return true;
  }

  /**
   * Returns the number of registered secrets.
   * Useful for testing.
   */
  getSecretCount(): number {
    return this.secrets.size;
  }

  /**
   * Clears all registered secrets.
   * Useful for testing.
   */
  clear(): void {
    this.secrets.clear();
  }
}

/**
 * Creates a CredentialGuard from auth config.
 */
export function createCredentialGuard(config?: AuthConfig): CredentialGuard {
  return new CredentialGuard(config);
}
