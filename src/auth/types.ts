/**
 * Authentication type definitions for authenticated crawling.
 * Defines configuration interfaces for roles, credentials, login, and session management.
 */

/**
 * Root configuration for authenticated crawling.
 */
export interface AuthConfig {
  /** Roles to crawl as (empty = unauthenticated only) */
  roles: RoleConfig[];

  /** Login page configuration */
  login?: LoginConfig;

  /** Custom login script path (TypeScript/JavaScript) */
  customLoginScript?: string;

  /** Session timeout detection settings */
  sessionTimeout?: SessionTimeoutConfig;
}

/**
 * Configuration for a single user role.
 */
export interface RoleConfig {
  /** Unique role identifier (e.g., "admin", "user", "guest") */
  name: string;

  /** Credential source - environment variable names */
  credentials: CredentialSource;

  /**
   * Explicit privilege level (1 = lowest, higher = more privileged).
   * If omitted, inferred from accessible page count post-crawl.
   */
  privilegeLevel?: number;

  /** Authentication method to use for this role */
  authMethod: AuthMethod;
}

/**
 * Authentication method type - discriminated union.
 */
export type AuthMethod =
  | { type: 'form-login' }
  | { type: 'cookie-injection'; cookies: CookieSource }
  | { type: 'token-injection'; header: string; tokenEnvVar: string }
  | { type: 'storage-state'; path: string }
  | { type: 'custom-script'; scriptPath: string };

/**
 * References to credential values (never stores actual credentials).
 */
export interface CredentialSource {
  /** Environment variable name for username/email */
  identifierEnvVar: string;

  /** Environment variable name for password */
  passwordEnvVar: string;
}

/**
 * Configuration for form-based login.
 */
export interface LoginConfig {
  /** URL of the login page */
  url: string;

  /**
   * Form field selectors (optional - auto-detect if not provided).
   * Use CSS selectors.
   */
  selectors?: LoginSelectors;

  /** Success indicators to verify login succeeded */
  successIndicators?: SuccessIndicator[];
}

/**
 * CSS selectors for login form fields.
 */
export interface LoginSelectors {
  /** Selector for username/email input */
  identifier?: string;

  /** Selector for password input */
  password?: string;

  /** Selector for submit button */
  submit?: string;

  /** Selector for the login form itself */
  form?: string;
}

/**
 * Success indicator types - discriminated union.
 */
export type SuccessIndicator =
  | { type: 'url-pattern'; pattern: string }
  | { type: 'element-visible'; selector: string }
  | { type: 'element-hidden'; selector: string }
  | { type: 'cookie-present'; name: string }
  | { type: 'cookie-absent'; name: string };

/**
 * Configuration for detecting and handling session expiry.
 */
export interface SessionTimeoutConfig {
  /** Indicators that session has expired */
  expiryIndicators: ExpiryIndicator[];

  /** Maximum re-authentication attempts per crawl */
  maxReauthAttempts?: number; // Default: 3
}

/**
 * Session expiry indicator types - discriminated union.
 */
export type ExpiryIndicator =
  | { type: 'status-code'; codes: number[] }
  | { type: 'redirect-to-login' }
  | { type: 'element-visible'; selector: string };

/**
 * Source for cookie injection authentication.
 */
export type CookieSource =
  | { type: 'env-var'; envVar: string } // JSON-encoded cookies
  | { type: 'file'; path: string }; // Netscape cookie file or JSON

/**
 * Logged authentication events (no credentials).
 */
export interface AuthEvent {
  /** Event timestamp */
  timestamp: string; // ISO 8601

  /** Event type */
  type: 'login' | 're-auth' | 'logout' | 'auth-failure';

  /** Role involved */
  role: string;

  /** Success status */
  success: boolean;

  /** Error message if failed (no credentials) */
  error?: string;

  /** Duration in milliseconds */
  durationMs?: number;
}

/**
 * Extended Page model with authentication metadata.
 */
export interface AuthenticatedPage {
  /** Page URL */
  url: string;

  /** HTTP status code */
  status: number;

  /** Page title */
  title?: string;

  /** When page was discovered */
  discoveredAt: string;

  /** When page was processed */
  processedAt?: string;

  /** Links discovered on this page */
  links?: string[];

  /** Error if page failed to load */
  error?: string;

  /**
   * Required authentication level to access this page.
   * Common values: 'public' (no auth), 'authenticated' (any logged-in user),
   * or a specific role name (e.g., 'admin').
   */
  authLevel: string;

  /** Roles that can access this page */
  accessibleByRoles: string[];

  /** Minimum privilege level required */
  minPrivilegeLevel: number;
}

/**
 * Result of a single role's crawl.
 */
export interface RoleCrawlResult {
  /** Role name */
  role: string;

  /** Pages accessible by this role */
  accessiblePages: AuthenticatedPage[];

  /** Pages exclusive to this role (not accessible by lower-privilege roles) */
  exclusivePages: AuthenticatedPage[];

  /** Crawl duration for this role */
  durationMs: number;
}

/**
 * Result of a multi-role authenticated crawl.
 */
export interface MultiRoleCrawlResult {
  /** Base crawl summary */
  summary: {
    startUrl: string;
    totalPages: number;
    totalLinks: number;
    durationMs: number;
    stopReason: string;
  };

  /** All discovered pages with auth levels */
  pages: AuthenticatedPage[];

  /** Role-specific results */
  roleResults: Record<string, RoleCrawlResult>;

  /** Authentication events log */
  authEvents: AuthEvent[];

  /** Role privilege hierarchy (ordered by privilege, highest first) */
  roleHierarchy: string[];
}

/**
 * Default session timeout configuration.
 */
export function createDefaultSessionTimeoutConfig(): SessionTimeoutConfig {
  return {
    expiryIndicators: [
      { type: 'status-code', codes: [401, 403] },
      { type: 'redirect-to-login' },
    ],
    maxReauthAttempts: 3,
  };
}

/**
 * Creates an empty auth config.
 */
export function createEmptyAuthConfig(): AuthConfig {
  return {
    roles: [],
  };
}
