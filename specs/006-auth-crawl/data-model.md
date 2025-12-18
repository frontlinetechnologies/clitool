# Data Model: Authenticated Crawling & Testing

**Feature**: 006-auth-crawl
**Date**: 2025-12-17

## Entities

### AuthConfig

Root configuration for authenticated crawling.

```typescript
interface AuthConfig {
  /** Roles to crawl as (empty = unauthenticated only) */
  roles: RoleConfig[];

  /** Login page configuration */
  login?: LoginConfig;

  /** Custom login script path (TypeScript/JavaScript) */
  customLoginScript?: string;

  /** Session timeout detection settings */
  sessionTimeout?: SessionTimeoutConfig;
}
```

**Validation Rules**:
- `roles` array can be empty (unauthenticated-only crawl)
- Each role name must be unique
- If `login` is provided, `login.url` is required

---

### RoleConfig

Configuration for a single user role.

```typescript
interface RoleConfig {
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

type AuthMethod =
  | { type: 'form-login' }
  | { type: 'cookie-injection'; cookies: CookieSource }
  | { type: 'token-injection'; header: string; tokenEnvVar: string }
  | { type: 'storage-state'; path: string }
  | { type: 'custom-script'; scriptPath: string };
```

**Validation Rules**:
- `name` must be non-empty, alphanumeric with hyphens/underscores
- `name` must be unique across all roles
- `privilegeLevel` if provided must be positive integer

---

### CredentialSource

References to credential values (never stores actual credentials).

```typescript
interface CredentialSource {
  /** Environment variable name for username/email */
  identifierEnvVar: string;

  /** Environment variable name for password */
  passwordEnvVar: string;
}
```

**Validation Rules**:
- Both env var names must be non-empty strings
- Validation does NOT check if env vars exist (runtime check)

---

### LoginConfig

Configuration for form-based login.

```typescript
interface LoginConfig {
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

interface LoginSelectors {
  /** Selector for username/email input */
  identifier?: string;

  /** Selector for password input */
  password?: string;

  /** Selector for submit button */
  submit?: string;

  /** Selector for the login form itself */
  form?: string;
}

type SuccessIndicator =
  | { type: 'url-pattern'; pattern: string }
  | { type: 'element-visible'; selector: string }
  | { type: 'element-hidden'; selector: string }
  | { type: 'cookie-present'; name: string }
  | { type: 'cookie-absent'; name: string };
```

**Validation Rules**:
- `url` must be valid URL
- `selectors` if provided must be valid CSS selectors
- At least one success indicator recommended (warning if none)

---

### SessionTimeoutConfig

Configuration for detecting and handling session expiry.

```typescript
interface SessionTimeoutConfig {
  /** Indicators that session has expired */
  expiryIndicators: ExpiryIndicator[];

  /** Maximum re-authentication attempts per crawl */
  maxReauthAttempts?: number; // Default: 3
}

type ExpiryIndicator =
  | { type: 'status-code'; codes: number[] }
  | { type: 'redirect-to-login' }
  | { type: 'element-visible'; selector: string };
```

**Default Values**:
- `expiryIndicators`: `[{ type: 'status-code', codes: [401, 403] }, { type: 'redirect-to-login' }]`
- `maxReauthAttempts`: 3

---

### CookieSource

Source for cookie injection authentication.

```typescript
type CookieSource =
  | { type: 'env-var'; envVar: string }  // JSON-encoded cookies
  | { type: 'file'; path: string };       // Netscape cookie file or JSON
```

---

### Role (Runtime Model)

Runtime representation of a role with crawl results.

```typescript
interface Role {
  /** Configuration for this role */
  config: RoleConfig;

  /** Computed privilege level (from config or inferred) */
  privilegeLevel: number;

  /** URLs accessible by this role */
  accessibleUrls: Set<string>;

  /** URLs discovered only by this role (not lower-privilege roles) */
  exclusiveUrls: Set<string>;

  /** Playwright storage state for session reuse */
  storageState?: StorageState;
}
```

---

### AuthenticatedPage (Extended Page Model)

Extension of existing `Page` model with authentication metadata.

```typescript
interface AuthenticatedPage extends Page {
  /**
   * Required authentication level to access this page.
   * 'public' = no auth required
   * 'authenticated' = any logged-in user
   * string = specific role name required
   */
  authLevel: 'public' | 'authenticated' | string;

  /** Roles that can access this page */
  accessibleByRoles: string[];

  /** Minimum privilege level required */
  minPrivilegeLevel: number;
}
```

**State Transitions**:
- Initial: `authLevel = 'unknown'` during crawl
- After baseline crawl: `authLevel = 'public'` for discovered pages
- After role crawl: `authLevel` updated based on access patterns

---

### AuthEvent (Audit Log)

Logged authentication events (no credentials).

```typescript
interface AuthEvent {
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
```

---

### MultiRoleCrawlResult

Result of a multi-role authenticated crawl.

```typescript
interface MultiRoleCrawlResult {
  /** Base crawl summary */
  summary: CrawlSummary;

  /** All discovered pages with auth levels */
  pages: AuthenticatedPage[];

  /** Role-specific results */
  roleResults: Map<string, RoleCrawlResult>;

  /** Authentication events log */
  authEvents: AuthEvent[];

  /** Role privilege hierarchy (ordered by privilege) */
  roleHierarchy: string[];
}

interface RoleCrawlResult {
  /** Role name */
  role: string;

  /** Pages accessible by this role */
  accessiblePages: AuthenticatedPage[];

  /** Pages exclusive to this role */
  exclusivePages: AuthenticatedPage[];

  /** Crawl duration for this role */
  durationMs: number;
}
```

## Entity Relationships

```
AuthConfig
├── RoleConfig[] (1:N)
│   ├── CredentialSource (1:1)
│   └── AuthMethod (1:1)
│       └── CookieSource? (1:1)
├── LoginConfig? (1:1)
│   ├── LoginSelectors? (1:1)
│   └── SuccessIndicator[] (1:N)
└── SessionTimeoutConfig? (1:1)
    └── ExpiryIndicator[] (1:N)

MultiRoleCrawlResult
├── CrawlSummary (1:1)
├── AuthenticatedPage[] (1:N)
├── RoleCrawlResult (1:N per role)
└── AuthEvent[] (1:N)
```

## Configuration File Schema

The auth config can be provided via:
1. Environment variables (preferred)
2. JSON/YAML config file (triggers security warning)
3. CLI flags for simple cases

**Example Config File** (`testarion.auth.json`):

```json
{
  "roles": [
    {
      "name": "admin",
      "credentials": {
        "identifierEnvVar": "ADMIN_EMAIL",
        "passwordEnvVar": "ADMIN_PASSWORD"
      },
      "authMethod": { "type": "form-login" },
      "privilegeLevel": 100
    },
    {
      "name": "user",
      "credentials": {
        "identifierEnvVar": "USER_EMAIL",
        "passwordEnvVar": "USER_PASSWORD"
      },
      "authMethod": { "type": "form-login" }
    }
  ],
  "login": {
    "url": "https://example.com/login",
    "successIndicators": [
      { "type": "url-pattern", "pattern": "/dashboard" },
      { "type": "cookie-present", "name": "session" }
    ]
  }
}
```
