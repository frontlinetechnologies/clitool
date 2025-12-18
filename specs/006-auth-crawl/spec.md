# Feature Specification: Authenticated Crawling & Testing

**Feature Branch**: `006-auth-crawl`
**Created**: 2025-12-17
**Status**: Draft
**Input**: User description: "Users can provide authentication credentials to crawl and test logged-in sections of their applications. The tool supports multiple authentication methods and maintains session state across crawling and test execution."

## Clarifications

### Session 2025-12-17

- Q: Maximum number of concurrent roles supported? → A: No enforced limit (user responsibility)
- Q: Session timeout handling strategy? → A: Silent re-auth with event logged (non-credential info only)
- Q: Unauthenticated baseline crawl behavior? → A: Always crawl unauthenticated first (automatic baseline)
- Q: Role access denial tests? → A: Generate denial tests (verify roles are blocked from unauthorized pages)
- Q: Role privilege hierarchy determination? → A: Infer from page access (more pages = higher privilege), allow explicit override

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Email/Password Authentication (Priority: P1)

A developer with a protected web application wants to crawl authenticated pages using standard login credentials. They configure test credentials, specify the login page, and run the crawler which authenticates before discovering protected routes.

**Why this priority**: Most web applications use email/password authentication. This is the core use case that enables all authenticated crawling functionality.

**Independent Test**: Configure credentials with username/password, run crawl against a login-protected site, verify authenticated pages are discovered and login flow works.

**Acceptance Scenarios**:

1. **Given** credentials configured in environment variables, **When** crawler starts, **Then** crawler authenticates via login form before crawling
2. **Given** invalid credentials provided, **When** authentication fails, **Then** clear error message displayed without exposing credentials
3. **Given** successful authentication, **When** session expires during crawl, **Then** crawler silently re-authenticates, logs the re-auth event (without credentials), and continues

---

### User Story 2 - Session State Persistence (Priority: P1)

A developer wants generated tests to run efficiently without re-authenticating for every test. The tool generates tests that reuse session state and includes proper authentication setup fixtures.

**Why this priority**: Without session persistence, tests become slow and flaky. This is essential for practical test execution.

**Independent Test**: Generate tests for authenticated pages, run test suite, verify session is reused across tests without repeated logins.

**Acceptance Scenarios**:

1. **Given** authenticated pages crawled, **When** tests are generated, **Then** tests include session persistence setup
2. **Given** test fixtures generated, **When** test suite runs, **Then** authentication happens once per role, not per test
3. **Given** credentials referenced in tests, **When** reviewing generated code, **Then** credentials are referenced via environment variables only

---

### User Story 3 - Multi-Role Crawling (Priority: P2)

A developer needs to test different user roles (admin, regular user, guest) to ensure role-based access control works correctly. The tool crawls the application as each configured role and tags discovered pages by required role.

**Why this priority**: Role-based access is common in SaaS applications. This enables comprehensive testing of permission systems.

**Independent Test**: Configure multiple roles with different credentials, run crawl, verify pages are tagged by required role and role-specific tests are organized separately.

**Acceptance Scenarios**:

1. **Given** admin and user roles configured, **When** crawl completes, **Then** admin-only pages are tagged separately from user-accessible pages
2. **Given** multiple roles configured, **When** tests are generated, **Then** role-specific test suites are created with appropriate fixtures
3. **Given** a page accessible to multiple roles, **When** output is reviewed, **Then** page is tagged with minimum required role
4. **Given** admin-only pages discovered, **When** tests are generated, **Then** access denial tests verify non-admin roles receive appropriate denial response

---

### User Story 4 - Cookie/Token Injection (Priority: P2)

A developer has an existing authenticated session (via browser dev tools or API) and wants to use those cookies or tokens instead of going through the login flow. This is useful for SSO systems or complex authentication.

**Why this priority**: Many applications use SSO, OAuth, or complex login flows that cannot be automated with simple form submission. Token injection provides a fallback.

**Independent Test**: Export session cookies from browser, inject via configuration, verify crawler accesses protected pages without performing login.

**Acceptance Scenarios**:

1. **Given** valid session cookies provided, **When** crawler starts, **Then** crawler uses injected cookies without login flow
2. **Given** session token provided via environment variable, **When** crawler makes requests, **Then** token is included in authentication headers
3. **Given** Playwright storage state file provided, **When** browser session starts, **Then** session state is restored automatically

---

### User Story 5 - Custom Login Scripts (Priority: P3)

A developer has a complex authentication flow (MFA, CAPTCHA, OAuth dance) that requires custom handling. They provide a custom login script that the crawler executes to obtain an authenticated session.

**Why this priority**: While less common, some applications require custom authentication logic. This ensures the tool works with any authentication system.

**Independent Test**: Create custom login script with MFA handling, configure crawler to use script, verify authentication succeeds and crawl proceeds.

**Acceptance Scenarios**:

1. **Given** custom login script configured, **When** authentication is needed, **Then** script executes and crawler uses resulting session
2. **Given** MFA handler configured, **When** MFA challenge appears, **Then** handler is invoked to complete authentication
3. **Given** custom script fails, **When** reviewing output, **Then** clear error message indicates script failure without exposing credentials

---

### Edge Cases

- What happens when login page URL is incorrect or unreachable?
- How does the system handle expired credentials mid-crawl?
- What happens when configured selectors don't match login form elements?
- How does the system handle rate limiting on login attempts?
- What happens when a role's credentials grant access to fewer pages than expected?
- How does the system handle CSRF tokens on login forms?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support email/password authentication via form submission with auto-detection of common login form patterns
- **FR-002**: System MUST support cookie-based session injection from configuration or file
- **FR-003**: System MUST support browser storage state files for Playwright session persistence
- **FR-004**: System MUST maintain authentication state across all requests during a crawl session
- **FR-005**: System MUST NEVER log, output, display, or embed credentials in any output, logs, or generated artifacts
- **FR-006**: System MUST tag crawled pages by required authentication level (public, authenticated, role-specific) based on comparison with unauthenticated baseline
- **FR-007**: System MUST support configuration of multiple user roles with separate credentials (no enforced limit on number of roles)
- **FR-008**: System MUST generate tests that reference credentials only via environment variables
- **FR-009**: System MUST verify successful authentication before proceeding with authenticated crawl
- **FR-010**: System MUST handle authentication failures gracefully with clear error messages that do not expose credentials
- **FR-011**: System MUST log authentication events (login, re-authentication, logout) with timestamps but without credential data
- **FR-012**: System MUST support custom login page URL configuration
- **FR-013**: System MUST support manual form field selector configuration when auto-detection fails
- **FR-014**: System MUST support configurable success indicators (URL pattern, element presence, cookie presence)
- **FR-015**: System MUST display security warning when credentials are configured in files instead of environment variables
- **FR-016**: System MUST suggest adding authentication config files to .gitignore
- **FR-017**: System MUST support custom login scripts for complex authentication flows
- **FR-018**: System MUST generate authentication helper fixtures for role-based testing
- **FR-019**: System MUST support session token injection via environment variables
- **FR-020**: System MUST perform an unauthenticated crawl first to establish public page baseline, then crawl as each configured role sequentially, and merge results
- **FR-021**: System MUST generate logout tests for each configured role
- **FR-022**: System MUST generate access denial tests verifying lower-privilege roles cannot access higher-privilege pages (privilege inferred from page access count, with optional explicit override)

### Key Entities

- **Credentials**: Authentication information including identifier (username/email), password/token, and associated role name. Never persisted in output.
- **Role**: Named user type (e.g., admin, customer, guest) with associated credentials, expected access level, and inferred privilege rank (based on accessible page count, overridable via config)
- **Authentication Method**: Strategy for obtaining an authenticated session (form login, cookie injection, token injection, storage state, custom script)
- **Session State**: Authenticated browser/session context including cookies, local storage, and authentication headers
- **Login Configuration**: Settings for authentication including login URL, form selectors, and success indicators

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can configure and authenticate within 5 minutes for standard email/password flows
- **SC-002**: Crawl of authenticated pages completes successfully for 95% of standard web applications without custom configuration
- **SC-003**: Generated test suites execute without manual credential entry - all credentials sourced from environment
- **SC-004**: Role-specific pages are correctly identified and tagged with 90% accuracy
- **SC-005**: Authentication failures provide actionable error messages in 100% of cases without credential exposure
- **SC-006**: Test suite execution time reduced by 80% compared to per-test authentication through session persistence
- **SC-007**: Zero credential exposure in any generated artifacts, logs, or console output (auditable via code review)
