# Auth Module API Contract

**Feature**: 006-auth-crawl
**Date**: 2025-12-17

## Module: `src/auth`

### Public Exports (`src/auth/index.ts`)

```typescript
// Types
export type {
  AuthConfig,
  RoleConfig,
  CredentialSource,
  LoginConfig,
  LoginSelectors,
  SuccessIndicator,
  SessionTimeoutConfig,
  ExpiryIndicator,
  AuthMethod,
  CookieSource,
  Role,
  AuthEvent,
  AuthenticatedPage,
  MultiRoleCrawlResult,
  RoleCrawlResult,
} from './types';

// Main classes
export { Authenticator } from './authenticator';
export { SessionManager } from './session-manager';
export { LoginDetector } from './login-detector';
export { CredentialGuard } from './credential-guard';

// Factory functions
export { createAuthenticator } from './authenticator';
export { loadAuthConfig, validateAuthConfig } from './config';
```

---

## Class: `Authenticator`

Main orchestrator for authentication operations.

```typescript
class Authenticator {
  /**
   * Creates an authenticator from config.
   * @param config - Authentication configuration
   * @param browser - Playwright browser instance
   */
  constructor(config: AuthConfig, browser: Browser);

  /**
   * Authenticates a specific role and returns browser context.
   * @param roleName - Name of role to authenticate
   * @returns Authenticated browser context
   * @throws AuthenticationError if authentication fails
   */
  async authenticate(roleName: string): Promise<BrowserContext>;

  /**
   * Checks if session is still valid for a role.
   * @param roleName - Name of role to check
   * @returns true if session is valid
   */
  async isSessionValid(roleName: string): Promise<boolean>;

  /**
   * Re-authenticates a role (used on session timeout).
   * @param roleName - Name of role to re-authenticate
   * @returns Fresh browser context
   * @emits AuthEvent with type 're-auth'
   */
  async reAuthenticate(roleName: string): Promise<BrowserContext>;

  /**
   * Logs out a specific role.
   * @param roleName - Name of role to log out
   * @emits AuthEvent with type 'logout'
   */
  async logout(roleName: string): Promise<void>;

  /**
   * Gets all authentication events that occurred.
   * @returns Array of auth events (credentials redacted)
   */
  getAuthEvents(): AuthEvent[];

  /**
   * Saves storage state for a role to file.
   * @param roleName - Name of role
   * @param path - File path to save state
   */
  async saveStorageState(roleName: string, path: string): Promise<void>;

  /**
   * Closes all browser contexts and cleans up.
   */
  async close(): Promise<void>;
}
```

**Events**:
- Emits `AuthEvent` for each authentication operation
- Events never contain credential values

---

## Class: `SessionManager`

Manages session state and detects timeouts.

```typescript
class SessionManager {
  /**
   * Creates session manager with timeout config.
   * @param config - Session timeout configuration
   */
  constructor(config?: SessionTimeoutConfig);

  /**
   * Checks if a response indicates session expiry.
   * @param response - Playwright response object
   * @param loginUrl - Login URL for redirect detection
   * @returns true if session has expired
   */
  isSessionExpired(response: Response, loginUrl: string): boolean;

  /**
   * Checks if page state indicates session expiry.
   * @param page - Playwright page object
   * @returns true if session appears expired
   */
  async checkPageForExpiry(page: Page): Promise<boolean>;

  /**
   * Records a re-authentication attempt.
   * @param roleName - Role that was re-authenticated
   * @returns Current attempt count
   * @throws Error if max attempts exceeded
   */
  recordReauthAttempt(roleName: string): number;

  /**
   * Resets re-auth counter for a role (on successful page load).
   * @param roleName - Role to reset
   */
  resetReauthCounter(roleName: string): void;
}
```

---

## Class: `LoginDetector`

Auto-detects login forms on a page.

```typescript
class LoginDetector {
  /**
   * Detects login form elements on a page.
   * @param page - Playwright page at login URL
   * @returns Detected selectors or null if not found
   */
  async detect(page: Page): Promise<LoginSelectors | null>;

  /**
   * Validates that detected/configured selectors work.
   * @param page - Playwright page
   * @param selectors - Selectors to validate
   * @returns true if all selectors find elements
   */
  async validateSelectors(page: Page, selectors: LoginSelectors): Promise<boolean>;
}

// Detection heuristics (internal)
interface DetectionHeuristics {
  passwordSelectors: string[];    // ['input[type="password"]', '#password', ...]
  identifierSelectors: string[];  // ['input[type="email"]', '#email', '#username', ...]
  submitSelectors: string[];      // ['button[type="submit"]', '#login-btn', ...]
  formSelectors: string[];        // ['form#login', 'form.login-form', ...]
}
```

---

## Class: `CredentialGuard`

Prevents credential leakage in all outputs.

```typescript
class CredentialGuard {
  /**
   * Creates guard with secrets to protect.
   * @param config - Auth config containing credential env var names
   */
  constructor(config: AuthConfig);

  /**
   * Registers additional secrets to redact.
   * @param secrets - Array of secret values
   */
  addSecrets(secrets: string[]): void;

  /**
   * Redacts all known secrets from text.
   * @param text - Text that may contain secrets
   * @returns Text with secrets replaced by [REDACTED]
   */
  redact(text: string): string;

  /**
   * Wraps a logger to auto-redact all output.
   * @param logger - Logger instance
   * @returns Wrapped logger with redaction
   */
  wrapLogger<T extends Logger>(logger: T): T;

  /**
   * Validates that output contains no secrets.
   * @param output - Output to validate
   * @returns true if no secrets found
   * @throws CredentialLeakError if secret detected
   */
  validateNoLeaks(output: string): boolean;
}
```

---

## Auth Method Implementations

### `src/auth/methods/form-login.ts`

```typescript
interface FormLoginMethod {
  /**
   * Performs form-based login.
   * @param context - Browser context
   * @param config - Login configuration
   * @param credentials - Credential values (from env)
   * @returns true if login successful
   */
  login(
    context: BrowserContext,
    config: LoginConfig,
    credentials: { identifier: string; password: string }
  ): Promise<boolean>;
}
```

### `src/auth/methods/storage-state.ts`

```typescript
interface StorageStateMethod {
  /**
   * Applies storage state to context.
   * @param context - Browser context
   * @param statePath - Path to storage state JSON
   */
  apply(context: BrowserContext, statePath: string): Promise<void>;

  /**
   * Saves current context state.
   * @param context - Browser context
   * @param statePath - Path to save state
   */
  save(context: BrowserContext, statePath: string): Promise<void>;
}
```

### `src/auth/methods/cookie-injection.ts`

```typescript
interface CookieInjectionMethod {
  /**
   * Injects cookies into context.
   * @param context - Browser context
   * @param cookies - Cookies to inject
   */
  inject(context: BrowserContext, cookies: Cookie[]): Promise<void>;

  /**
   * Loads cookies from source.
   * @param source - Cookie source (env var or file)
   * @returns Array of cookies
   */
  loadCookies(source: CookieSource): Promise<Cookie[]>;
}
```

### `src/auth/methods/token-injection.ts`

```typescript
interface TokenInjectionMethod {
  /**
   * Configures context to include auth token in requests.
   * @param context - Browser context
   * @param header - Header name (e.g., 'Authorization')
   * @param token - Token value
   */
  configure(context: BrowserContext, header: string, token: string): Promise<void>;
}
```

### `src/auth/methods/custom-script.ts`

```typescript
interface CustomScriptMethod {
  /**
   * Executes custom login script.
   * @param context - Browser context
   * @param scriptPath - Path to script file
   * @param credentials - Credentials if needed
   * @returns true if script indicates success
   */
  execute(
    context: BrowserContext,
    scriptPath: string,
    credentials?: { identifier: string; password: string }
  ): Promise<boolean>;
}

// Custom script interface (user implements)
interface CustomLoginScript {
  /**
   * User-provided login function.
   * @param page - Playwright page
   * @param credentials - Credentials from env
   * @returns true if login successful
   */
  login(
    page: Page,
    credentials: { identifier: string; password: string }
  ): Promise<boolean>;
}
```

---

## Error Types

```typescript
class AuthenticationError extends Error {
  constructor(
    message: string,
    public role: string,
    public cause?: Error
  );
}

class CredentialLeakError extends Error {
  constructor(
    message: string,
    public location: string
  );
}

class LoginFormNotFoundError extends Error {
  constructor(
    public loginUrl: string,
    public attemptedSelectors: string[]
  );
}

class SessionExpiredError extends Error {
  constructor(
    public role: string,
    public reauthAttempts: number
  );
}
```

---

## Integration with Crawler

### `src/crawler/multi-role-crawler.ts`

```typescript
class MultiRoleCrawler {
  /**
   * Performs multi-role authenticated crawl.
   * @param baseUrl - URL to crawl
   * @param authConfig - Authentication configuration
   * @param crawlConfig - Crawl configuration
   * @returns Multi-role crawl results
   */
  async crawl(
    baseUrl: string,
    authConfig: AuthConfig,
    crawlConfig?: Partial<CrawlConfig>
  ): Promise<MultiRoleCrawlResult>;
}
```

**Crawl Flow**:
1. Initialize `Authenticator`
2. Crawl unauthenticated (baseline)
3. For each role in privilege order:
   - Authenticate
   - Crawl with authenticated context
   - Track session expiry, re-auth if needed
   - Save role results
4. Compute page auth levels from access patterns
5. Build role hierarchy from page counts or explicit config
6. Return merged results
