# Test Generation API Contract

**Feature**: 006-auth-crawl
**Date**: 2025-12-17

## Generated Test Structure

### Directory Layout

```text
tests/
├── fixtures/
│   ├── auth.ts              # Authentication fixtures
│   └── roles/
│       ├── admin.ts         # Admin role fixture
│       └── user.ts          # User role fixture
├── auth/
│   ├── login.spec.ts        # Login flow tests
│   ├── logout.spec.ts       # Logout tests per role
│   └── access-control/
│       ├── admin-pages.spec.ts    # Admin page access tests
│       ├── user-pages.spec.ts     # User page access tests
│       └── denial.spec.ts         # Access denial tests
└── pages/
    ├── admin/               # Admin-only page tests
    └── shared/              # Multi-role accessible page tests
```

---

## Auth Fixtures Generator

### `src/test-generation/auth-fixtures.ts`

```typescript
interface AuthFixturesGenerator {
  /**
   * Generates authentication fixtures for Playwright tests.
   * @param crawlResult - Multi-role crawl results
   * @param outputDir - Directory for generated files
   * @returns Generated file paths
   */
  generate(
    crawlResult: MultiRoleCrawlResult,
    outputDir: string
  ): Promise<GeneratedFiles>;
}

interface GeneratedFiles {
  /** Main auth fixture file */
  authFixture: string;
  /** Per-role fixture files */
  roleFixtures: Map<string, string>;
  /** Environment template file */
  envTemplate: string;
}
```

### Generated Fixture Example

**`tests/fixtures/auth.ts`**:

```typescript
import { test as base, expect, BrowserContext } from '@playwright/test';
import * as path from 'path';

// Role storage state paths (from environment)
const AUTH_STATES: Record<string, string | undefined> = {
  admin: process.env.ADMIN_AUTH_STATE,
  user: process.env.USER_AUTH_STATE,
};

export type AuthRole = 'admin' | 'user' | 'unauthenticated';

interface AuthFixtures {
  /** Authenticated page for specified role */
  authenticatedPage: (role: AuthRole) => Promise<Page>;
  /** Admin-authenticated page (convenience) */
  adminPage: Page;
  /** User-authenticated page (convenience) */
  userPage: Page;
  /** Unauthenticated page */
  publicPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    const getPage = async (role: AuthRole) => {
      if (role === 'unauthenticated') {
        const context = await browser.newContext();
        contexts.push(context);
        return context.newPage();
      }

      const statePath = AUTH_STATES[role];
      if (!statePath) {
        throw new Error(`Missing auth state for role: ${role}. Set ${role.toUpperCase()}_AUTH_STATE env var.`);
      }

      const context = await browser.newContext({
        storageState: statePath,
      });
      contexts.push(context);
      return context.newPage();
    };

    await use(getPage);

    // Cleanup all contexts
    for (const ctx of contexts) {
      await ctx.close();
    }
  },

  adminPage: async ({ browser }, use) => {
    const statePath = AUTH_STATES.admin;
    if (!statePath) {
      throw new Error('Missing ADMIN_AUTH_STATE environment variable');
    }
    const context = await browser.newContext({ storageState: statePath });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  userPage: async ({ browser }, use) => {
    const statePath = AUTH_STATES.user;
    if (!statePath) {
      throw new Error('Missing USER_AUTH_STATE environment variable');
    }
    const context = await browser.newContext({ storageState: statePath });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  publicPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
```

---

## Denial Tests Generator

### `src/test-generation/denial-tests.ts`

```typescript
interface DenialTestsGenerator {
  /**
   * Generates access denial tests.
   * @param crawlResult - Multi-role crawl results
   * @param outputDir - Directory for generated files
   * @returns Generated file path
   */
  generate(
    crawlResult: MultiRoleCrawlResult,
    outputDir: string
  ): Promise<string>;
}
```

### Generated Denial Test Example

**`tests/auth/access-control/denial.spec.ts`**:

```typescript
import { test, expect } from '../../fixtures/auth';

test.describe('Access Denial - User Role', () => {
  test.describe.configure({ mode: 'serial' });

  const adminOnlyPages = [
    '/admin/dashboard',
    '/admin/users',
    '/admin/settings',
  ];

  for (const page of adminOnlyPages) {
    test(`should deny user access to ${page}`, async ({ userPage }) => {
      const response = await userPage.goto(page);

      // Expect either:
      // 1. 401/403 status code
      // 2. Redirect to login page
      // 3. Redirect to unauthorized page
      const status = response?.status() ?? 0;
      const url = userPage.url();

      const isDenied =
        status === 401 ||
        status === 403 ||
        url.includes('/login') ||
        url.includes('/unauthorized');

      expect(isDenied, `Expected access denied for ${page}, got status ${status} at ${url}`).toBe(true);
    });
  }
});

test.describe('Access Denial - Unauthenticated', () => {
  test.describe.configure({ mode: 'serial' });

  const protectedPages = [
    '/dashboard',
    '/profile',
    '/settings',
  ];

  for (const page of protectedPages) {
    test(`should require auth for ${page}`, async ({ publicPage }) => {
      const response = await publicPage.goto(page);
      const status = response?.status() ?? 0;
      const url = publicPage.url();

      const requiresAuth =
        status === 401 ||
        status === 403 ||
        url.includes('/login');

      expect(requiresAuth, `Expected auth required for ${page}`).toBe(true);
    });
  }
});
```

---

## Logout Tests Generator

### `src/test-generation/logout-tests.ts`

```typescript
interface LogoutTestsGenerator {
  /**
   * Generates logout tests for each role.
   * @param crawlResult - Multi-role crawl results
   * @param outputDir - Directory for generated files
   * @returns Generated file path
   */
  generate(
    crawlResult: MultiRoleCrawlResult,
    outputDir: string
  ): Promise<string>;
}
```

### Generated Logout Test Example

**`tests/auth/logout.spec.ts`**:

```typescript
import { test, expect } from '../fixtures/auth';

test.describe('Logout Tests', () => {

  test('admin can log out successfully', async ({ adminPage }) => {
    // Navigate to authenticated page first
    await adminPage.goto('/dashboard');
    await expect(adminPage.locator('[data-testid="user-menu"]')).toBeVisible();

    // Perform logout (adjust selector based on app)
    await adminPage.click('[data-testid="logout-button"]');

    // Verify logged out - should redirect to login or public page
    await expect(adminPage).toHaveURL(/\/(login|home|\/?$)/);

    // Verify cannot access protected page
    await adminPage.goto('/dashboard');
    await expect(adminPage).toHaveURL(/\/login/);
  });

  test('user can log out successfully', async ({ userPage }) => {
    await userPage.goto('/profile');
    await expect(userPage.locator('[data-testid="user-menu"]')).toBeVisible();

    await userPage.click('[data-testid="logout-button"]');

    await expect(userPage).toHaveURL(/\/(login|home|\/?$)/);

    await userPage.goto('/profile');
    await expect(userPage).toHaveURL(/\/login/);
  });
});
```

---

## Environment Template Generator

### Generated `.env.test.example`

```bash
# Authentication State Files
# Generate these by running: testarion auth login <login-url> -o <output-path>

# Admin role
ADMIN_AUTH_STATE=./auth-states/admin.json
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<set-your-password>

# User role
USER_AUTH_STATE=./auth-states/user.json
USER_EMAIL=user@example.com
USER_PASSWORD=<set-your-password>

# Test configuration
BASE_URL=https://example.com
```

---

## Integration Points

### Test Generation Pipeline

```typescript
interface AuthTestGenerationPipeline {
  /**
   * Generates all authentication-related tests.
   * @param crawlResult - Multi-role crawl results
   * @param options - Generation options
   */
  async generate(
    crawlResult: MultiRoleCrawlResult,
    options: AuthTestGenerationOptions
  ): Promise<AuthTestGenerationResult>;
}

interface AuthTestGenerationOptions {
  /** Output directory for tests */
  outputDir: string;
  /** Generate auth fixtures */
  fixtures?: boolean;  // default: true
  /** Generate denial tests */
  denialTests?: boolean;  // default: true
  /** Generate logout tests */
  logoutTests?: boolean;  // default: true
  /** Custom fixture template */
  fixtureTemplate?: string;
}

interface AuthTestGenerationResult {
  /** All generated file paths */
  files: string[];
  /** Stats about generated tests */
  stats: {
    totalTests: number;
    denialTests: number;
    logoutTests: number;
    rolesCount: number;
  };
}
```
