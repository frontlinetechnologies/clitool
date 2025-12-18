# Research: Authenticated Crawling & Testing

**Feature**: 006-auth-crawl
**Date**: 2025-12-17

## Research Topics

### 1. Playwright Authentication Patterns

**Decision**: Use Playwright's built-in `BrowserContext` with storage state for session persistence.

**Rationale**:
- Playwright provides first-class support for authentication via `storageState` option
- Browser contexts isolate sessions, enabling multi-role crawling without browser restarts
- Storage state captures cookies, localStorage, and sessionStorage in a single JSON file
- Re-authentication can be detected by checking for auth failure responses (401, 403) or redirect to login

**Alternatives Considered**:
- Manual cookie injection: Rejected because Playwright's storage state is more comprehensive (includes localStorage)
- Separate browser instances per role: Rejected due to memory overhead and slower startup
- HTTP-level auth (headers only): Rejected because many apps require browser-based session management

**Implementation Pattern**:
```typescript
// Create authenticated context
const context = await browser.newContext({
  storageState: 'auth-state.json' // or inline object
});

// Save state after authentication
await context.storageState({ path: 'auth-state.json' });
```

### 2. Login Form Auto-Detection

**Decision**: Use heuristic-based detection with configurable fallback selectors.

**Rationale**:
- Common patterns: `input[type="email"]`, `input[type="password"]`, `form[action*="login"]`
- 80%+ of login forms follow standard HTML patterns
- Manual selector config handles edge cases without code changes
- Aligns with Constitution Article I (Simplicity First)

**Detection Heuristics**:
1. Find forms containing password field
2. Look for common identifiers: `#login`, `#signin`, `.login-form`, `[data-testid*="login"]`
3. Check for text labels: "Sign in", "Log in", "Email", "Password"
4. Validate form has both identifier (email/username) and password inputs

**Alternatives Considered**:
- AI-based form detection: Rejected due to latency and API cost for simple task
- Require manual selectors always: Rejected as violates zero-config principle
- XPath-based detection: Rejected for complexity; CSS selectors sufficient

### 3. Credential Security

**Decision**: Never store credentials in memory longer than authentication; redact from all outputs.

**Rationale**:
- FR-005: Credentials MUST NEVER appear in output, logs, or artifacts
- Environment variables are the recommended source (FR-008)
- File-based config triggers security warning (FR-014)

**Implementation Pattern**:
```typescript
// Credential guard wraps all logging/output
class CredentialGuard {
  private secrets: Set<string>;

  redact(text: string): string {
    for (const secret of this.secrets) {
      text = text.replace(new RegExp(secret, 'g'), '[REDACTED]');
    }
    return text;
  }
}
```

**Alternatives Considered**:
- Hash credentials in memory: Rejected because we need plaintext for form submission
- Encrypt config files: Rejected as adds complexity; env vars are simpler

### 4. Session Timeout Detection & Re-authentication

**Decision**: Detect auth failure via HTTP status (401, 403) or redirect to login URL; silently re-authenticate with logged event.

**Rationale**:
- Clarification session: Silent re-auth with event logged (non-credential info only)
- Re-auth must be automatic to avoid crawl interruption
- Configurable success indicators (FR-014) enable custom detection

**Detection Methods**:
1. HTTP 401/403 response codes
2. Redirect to configured login URL
3. Presence of login form on response page
4. Absence of expected "logged in" indicator (cookie, element)

**Alternatives Considered**:
- Time-based session refresh: Rejected as wasteful; react to actual expiry
- Fail on session timeout: Rejected per clarification decision

### 5. Multi-Role Crawl Orchestration

**Decision**: Sequential crawling with shared discovered URL set; unauthenticated baseline first.

**Rationale**:
- Clarification: Always crawl unauthenticated first (automatic baseline)
- Sequential avoids resource contention and simplifies result merging
- Shared URL discovery enables accurate "minimum required role" tagging

**Orchestration Flow**:
1. Crawl unauthenticated → baseline pages set
2. For each role (by privilege order):
   - Authenticate
   - Crawl with existing URL set as seeds
   - Record newly discovered pages as role-specific
3. Merge results with auth level tags

**Alternatives Considered**:
- Parallel role crawling: Rejected due to complexity of result merging and resource usage
- Role-only crawling (no baseline): Rejected per clarification

### 6. Role Privilege Hierarchy

**Decision**: Infer privilege from accessible page count; allow explicit override in config.

**Rationale**:
- Clarification: Infer from page access (more pages = higher privilege), allow explicit override
- Simple heuristic works for most RBAC systems
- Override handles edge cases (guest with unique pages)

**Implementation**:
```typescript
interface RoleConfig {
  name: string;
  credentials: CredentialSource;
  privilegeLevel?: number; // Optional override; if omitted, infer from page count
}

// After crawl, sort roles by accessible page count
roles.sort((a, b) => b.accessiblePages.length - a.accessiblePages.length);
```

### 7. Test Generation for Authentication

**Decision**: Generate role-based fixtures using Playwright's `test.use()` pattern with storage state.

**Rationale**:
- Playwright best practices use fixtures for auth state sharing
- `test.describe.configure({ mode: 'serial' })` for auth-dependent tests
- Environment variables for credentials per FR-008

**Generated Test Pattern**:
```typescript
// fixtures/auth.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: process.env.AUTH_STATE_PATH
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
```

### 8. Access Denial Test Generation

**Decision**: Generate tests that verify lower-privilege roles receive 401, 403, or redirect when accessing higher-privilege pages.

**Rationale**:
- Clarification: Generate denial tests (verify roles are blocked from unauthorized pages)
- Critical for RBAC security validation
- Tests reference pages by URL from crawl results

**Test Pattern**:
```typescript
test.describe('Access Control - User Role', () => {
  test('should deny access to admin dashboard', async ({ userPage }) => {
    const response = await userPage.goto('/admin/dashboard');
    expect([401, 403]).toContain(response.status());
    // OR check for redirect to login
    expect(userPage.url()).toContain('/login');
  });
});
```

## Dependencies & Integrations

| Dependency | Version | Purpose | Notes |
|------------|---------|---------|-------|
| playwright | 1.40+ | Browser automation, storage state | Already installed |
| @anthropic-ai/sdk | 0.71+ | AI test generation | Already installed |
| commander | 11.x | CLI parsing | Already installed |

**No new dependencies required** - all functionality achievable with existing stack.

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Credential leakage in logs | High | CredentialGuard redaction layer; code review checklist |
| Login form detection failures | Medium | Clear error message with manual config fallback |
| Session timeout during long crawls | Low | Silent re-auth with logging |
| Memory usage with many roles | Low | Sequential crawling; context cleanup |

## Open Questions Resolved

All NEEDS CLARIFICATION items from spec have been addressed:
- ✅ Role limit: No enforced limit
- ✅ Session timeout handling: Silent re-auth with logged event
- ✅ Unauthenticated baseline: Always first
- ✅ Denial tests: Generated for all role combinations
- ✅ Privilege hierarchy: Inferred from page count with override
