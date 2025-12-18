/**
 * Error types for authentication module.
 * Provides structured error handling for auth-related failures.
 */

/**
 * Base error for authentication failures.
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly role: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'AuthenticationError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }

  /**
   * Creates a user-friendly error message.
   * Maps to CLI error codes: AUTH001, AUTH003
   */
  toUserMessage(): string {
    return `AUTH001: Authentication failed for role '${this.role}'. ${this.message}`;
  }
}

/**
 * Error when credentials are detected in output.
 */
export class CredentialLeakError extends Error {
  constructor(
    message: string,
    public readonly location: string,
  ) {
    super(message);
    this.name = 'CredentialLeakError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CredentialLeakError);
    }
  }

  /**
   * Creates a user-friendly error message.
   */
  toUserMessage(): string {
    return `SECURITY: Credential leak detected in ${this.location}. ${this.message}`;
  }
}

/**
 * Error when login form cannot be detected.
 */
export class LoginFormNotFoundError extends Error {
  constructor(
    public readonly loginUrl: string,
    public readonly attemptedSelectors: string[],
  ) {
    super(`Login form not detected at ${loginUrl}`);
    this.name = 'LoginFormNotFoundError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LoginFormNotFoundError);
    }
  }

  /**
   * Creates a user-friendly error message.
   * Maps to CLI error code: AUTH002
   */
  toUserMessage(): string {
    const selectorsAttempted =
      this.attemptedSelectors.length > 0
        ? ` Attempted selectors: ${this.attemptedSelectors.join(', ')}.`
        : '';
    return `AUTH002: Login form not detected at ${this.loginUrl}.${selectorsAttempted} Provide manual selectors with --username-selector, --password-selector, --submit-selector.`;
  }
}

/**
 * Error when session expires and re-authentication fails.
 */
export class SessionExpiredError extends Error {
  constructor(
    public readonly role: string,
    public readonly reauthAttempts: number,
  ) {
    super(`Session expired for role '${role}' after ${reauthAttempts} re-authentication attempts`);
    this.name = 'SessionExpiredError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SessionExpiredError);
    }
  }

  /**
   * Creates a user-friendly error message.
   * Maps to CLI error code: AUTH003
   */
  toUserMessage(): string {
    return `AUTH003: Session expired, re-authentication failed for role '${this.role}' after ${this.reauthAttempts} attempts. Check if credentials are still valid.`;
  }
}

/**
 * Error when required credentials are not found in environment.
 */
export class CredentialsNotFoundError extends Error {
  constructor(
    public readonly role: string,
    public readonly missingVars: string[],
  ) {
    super(`Credentials not found for role '${role}'`);
    this.name = 'CredentialsNotFoundError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CredentialsNotFoundError);
    }
  }

  /**
   * Creates a user-friendly error message.
   * Maps to CLI error code: AUTH004
   */
  toUserMessage(): string {
    return `AUTH004: Credentials not found in environment. Set ${this.missingVars.join(', ')} environment variable(s).`;
  }
}

/**
 * Error when storage state file is not found.
 */
export class StorageStateNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`Storage state file not found: ${path}`);
    this.name = 'StorageStateNotFoundError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageStateNotFoundError);
    }
  }

  /**
   * Creates a user-friendly error message.
   * Maps to CLI error code: AUTH005
   */
  toUserMessage(): string {
    return `AUTH005: Storage state file not found: ${this.path}. Run 'testarion auth login' to create state file.`;
  }
}

/**
 * Error when auth configuration is invalid.
 */
export class AuthConfigError extends Error {
  constructor(
    message: string,
    public readonly details?: string,
  ) {
    super(message);
    this.name = 'AuthConfigError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthConfigError);
    }
  }

  /**
   * Creates a user-friendly error message.
   * Maps to CLI error code: AUTH006
   */
  toUserMessage(): string {
    const detailsStr = this.details ? ` ${this.details}` : '';
    return `AUTH006: Invalid auth config: ${this.message}.${detailsStr} See config schema in documentation.`;
  }
}

/**
 * Error code enum for CLI output.
 */
export enum AuthErrorCode {
  AUTH001 = 'AUTH001', // Authentication failed
  AUTH002 = 'AUTH002', // Login form not detected
  AUTH003 = 'AUTH003', // Session expired, re-auth failed
  AUTH004 = 'AUTH004', // Credentials not found
  AUTH005 = 'AUTH005', // Storage state not found
  AUTH006 = 'AUTH006', // Invalid auth config
  AUTH007 = 'AUTH007', // Security warning (credentials in config)
}
