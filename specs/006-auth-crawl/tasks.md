# Tasks: Authenticated Crawling & Testing

**Input**: Design documents from `/specs/006-auth-crawl/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are generated per spec requirement for 80% coverage (Constitution Article VIII).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create auth module structure and foundational types

- [X] T001 Create auth module directory structure: src/auth/, src/auth/methods/
- [X] T002 [P] Create auth type definitions in src/auth/types.ts (AuthConfig, RoleConfig, CredentialSource, LoginConfig, etc.)
- [X] T003 [P] Create auth error types in src/auth/errors.ts (AuthenticationError, CredentialLeakError, LoginFormNotFoundError, SessionExpiredError)
- [X] T004 [P] Create Role model in src/models/role.ts
- [X] T005 Create auth module public exports in src/auth/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core credential security and configuration loading - MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Implement CredentialGuard class in src/auth/credential-guard.ts with redact(), addSecrets(), wrapLogger(), validateNoLeaks()
- [X] T007 Unit test CredentialGuard in tests/unit/auth/credential-guard.test.ts
- [X] T008 Implement auth config loader in src/auth/config.ts with loadAuthConfig(), validateAuthConfig()
- [X] T009 Unit test auth config loader in tests/unit/auth/config.test.ts
- [X] T010 [P] Extend Page model with authLevel, accessibleByRoles, minPrivilegeLevel in src/models/page.ts
- [X] T011 [P] Add auth config types to src/crawler/crawl-config.ts
- [X] T012 Update config-loader in src/utils/config-loader.ts to support auth config files

**Checkpoint**: Foundation ready - CredentialGuard and config loading work, Page model extended

---

## Phase 3: User Story 1 - Email/Password Authentication (Priority: P1) 🎯 MVP

**Goal**: Developers can crawl authenticated pages using email/password form login

**Independent Test**: Configure credentials via env vars, run crawl with --auth-role and --login-url, verify authenticated pages discovered

### Tests for User Story 1

- [X] T013 [P] [US1] Unit test LoginDetector in tests/unit/auth/login-detector.test.ts
- [X] T014 [P] [US1] Unit test form-login method in tests/unit/auth/methods/form-login.test.ts
- [X] T015 [P] [US1] Unit test Authenticator in tests/unit/auth/authenticator.test.ts
- [X] T016 [US1] Integration test for single-role auth crawl in tests/integration/auth-crawl.test.ts

### Implementation for User Story 1

- [X] T017 [P] [US1] Implement LoginDetector class in src/auth/login-detector.ts with detect(), validateSelectors(), checkSuccess(config)
- [X] T018 [P] [US1] Implement form-login auth method in src/auth/methods/form-login.ts
- [X] T019 [US1] Implement Authenticator class in src/auth/authenticator.ts with authenticate(), isSessionValid(), getAuthEvents(), saveStorageState(), close()
- [X] T020 [US1] Modify PageProcessor in src/crawler/page-processor.ts to accept BrowserContext parameter
- [X] T021 [US1] Modify Crawler class in src/crawler/crawler.ts to accept auth context and use authenticated BrowserContext
- [X] T022 [US1] Add --auth-role, --login-url CLI options to src/cli/crawl.ts
- [X] T022a [US1] Add --username-selector, --password-selector, --submit-selector CLI options to src/cli/crawl.ts for manual form field override (FR-013)
- [X] T022b [US1] Add --auth-success-url, --auth-success-selector, --auth-success-cookie CLI options for configurable success detection (FR-014)
- [X] T023 [US1] Add auth event logging integration to crawler (AuthEvent emission)
- [X] T024 [US1] Implement error messages AUTH001, AUTH002, AUTH004 per CLI contract
- [X] T024a [US1] Handle edge case: unreachable/incorrect login URL with AUTH004 error and actionable message
- [X] T024b [US1] Handle edge case: CSRF token detection and auto-inclusion in form submission (LoginDetector)
- [X] T024c [US1] Handle edge case: rate limiting detection with configurable retry (default: 3 attempts, exponential backoff)
- [X] T024d [US1] Handle edge case: selector mismatch with fallback to manual config prompt

**Checkpoint**: Single-role email/password authentication works end-to-end

---

## Phase 4: User Story 2 - Session State Persistence (Priority: P1)

**Goal**: Generated tests reuse session state and include auth fixtures

**Independent Test**: Generate tests from authenticated crawl, run test suite, verify session reused (no repeated logins)

### Tests for User Story 2

- [X] T025 [P] [US2] Unit test SessionManager in tests/unit/auth/session-manager.test.ts
- [X] T026 [P] [US2] Unit test auth-fixtures generator in tests/unit/test-generation/auth-fixtures.test.ts

### Implementation for User Story 2

- [X] T027 [P] [US2] Implement SessionManager class in src/auth/session-manager.ts with isSessionExpired(), checkPageForExpiry(), recordReauthAttempt(), resetReauthCounter()
- [X] T028 [P] [US2] Implement storage-state auth method in src/auth/methods/storage-state.ts with apply(), save()
- [X] T029 [US2] Add silent re-authentication to Authenticator with reAuthenticate() method
- [X] T030 [US2] Implement auth-fixtures generator in src/test-generation/auth-fixtures.ts
- [X] T031 [US2] Add --auth-fixtures flag to generate-tests CLI in src/cli/generate-tests.ts
- [X] T032 [US2] Update generated tests to reference credentials via env vars only (FR-008)
- [X] T033 [US2] Add --storage-state CLI option to crawl command in src/cli/crawl.ts

**Checkpoint**: Session persistence works; generated tests include fixtures and use env vars

---

## Phase 5: User Story 3 - Multi-Role Crawling (Priority: P2)

**Goal**: Crawl as multiple roles, tag pages by required auth level, generate access denial tests

**Independent Test**: Configure admin and user roles, run crawl, verify pages tagged by role with denial tests generated

### Tests for User Story 3

- [ ] T034 [P] [US3] Unit test MultiRoleCrawler in tests/unit/crawler/multi-role-crawler.test.ts
- [ ] T035 [P] [US3] Unit test denial-tests generator in tests/unit/test-generation/denial-tests.test.ts

### Implementation for User Story 3

- [ ] T036 [US3] Implement MultiRoleCrawler in src/crawler/multi-role-crawler.ts with crawl() orchestrating baseline + role crawls
- [ ] T037 [US3] Implement role hierarchy inference (page count based) in MultiRoleCrawler
- [ ] T038 [US3] Implement page auth level tagging based on baseline comparison (FR-006)
- [ ] T039 [US3] Implement denial-tests generator in src/test-generation/denial-tests.ts
- [ ] T040 [US3] Add --auth-config CLI option to crawl command in src/cli/crawl.ts
- [ ] T041 [US3] Add --denial-tests flag to generate-tests CLI in src/cli/generate-tests.ts
- [ ] T042 [US3] Add --skip-unauthenticated CLI option for baseline skip
- [ ] T043 [US3] Implement logout-tests generator in src/test-generation/logout-tests.ts
- [ ] T044 [US3] Add --logout-tests flag to generate-tests CLI in src/cli/generate-tests.ts
- [ ] T045 [US3] Update JSON output format with auth section (roleResults, roleHierarchy, events)

**Checkpoint**: Multi-role crawling works; pages tagged by auth level; denial and logout tests generated

---

## Phase 6: User Story 4 - Cookie/Token Injection (Priority: P2)

**Goal**: Support session injection via cookies or tokens for SSO/OAuth scenarios

**Independent Test**: Export session cookies, inject via config, verify crawler accesses protected pages

### Tests for User Story 4

- [ ] T046 [P] [US4] Unit test cookie-injection method in tests/unit/auth/methods/cookie-injection.test.ts
- [ ] T047 [P] [US4] Unit test token-injection method in tests/unit/auth/methods/token-injection.test.ts

### Implementation for User Story 4

- [ ] T048 [P] [US4] Implement cookie-injection auth method in src/auth/methods/cookie-injection.ts with inject(), loadCookies()
- [ ] T049 [P] [US4] Implement token-injection auth method in src/auth/methods/token-injection.ts with configure()
- [ ] T050 [US4] Integrate cookie-injection and token-injection methods into Authenticator
- [ ] T051 [US4] Support {ROLE}_TOKEN and {ROLE}_COOKIES env var patterns

**Checkpoint**: Cookie and token injection authentication works

---

## Phase 7: User Story 5 - Custom Login Scripts (Priority: P3)

**Goal**: Support custom login scripts for MFA, CAPTCHA, OAuth flows

**Independent Test**: Create custom login script with MFA handling, verify authentication succeeds

### Tests for User Story 5

- [ ] T052 [P] [US5] Unit test custom-script method in tests/unit/auth/methods/custom-script.test.ts

### Implementation for User Story 5

- [ ] T053 [US5] Implement custom-script auth method in src/auth/methods/custom-script.ts with execute()
- [ ] T054 [US5] Define CustomLoginScript interface for user-provided scripts
- [ ] T055 [US5] Integrate custom-script method into Authenticator
- [ ] T056 [US5] Add error handling for script failures (AUTH003 variant)

**Checkpoint**: Custom login scripts work for complex authentication flows

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: CLI utilities, security warnings, documentation

- [ ] T057 [P] Implement `testarion auth login` subcommand in src/cli/auth.ts
- [ ] T058 [P] Implement `testarion auth verify` subcommand in src/cli/auth.ts
- [ ] T059 Add security warning for credentials in config files (AUTH007) in src/auth/config.ts
- [ ] T060 Add .gitignore suggestion for auth config files
- [ ] T061 [P] Contract test for auth config schema in tests/contract/auth-config.test.ts
- [ ] T062 Update CLI help text with auth options
- [ ] T063 Run quickstart.md examples validation
- [ ] T064 Final CredentialGuard audit: verify no credential leakage in all outputs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) and US2 (P1): Can proceed in parallel after foundation
  - US3 (P2): Depends on US1 for basic auth, US2 for session persistence
  - US4 (P2): Can proceed after foundation (independent auth methods)
  - US5 (P3): Can proceed after foundation (independent auth method)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core auth implementation
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Session persistence (parallel with US1)
- **User Story 3 (P2)**: Depends on US1 (Authenticator) and US2 (SessionManager) - Multi-role orchestration
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent auth methods
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent auth method

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Types/models before services
- Services before CLI integration
- Core implementation before test generation features

### Parallel Opportunities

- T002, T003, T004 can run in parallel (different files)
- T010, T011 can run in parallel (different files)
- T013, T014, T015 can run in parallel (test files)
- T017, T018 can run in parallel (detector vs method)
- T025, T026, T034, T035 can run in parallel (test files)
- T046, T047, T048, T049, T052, T053 can run in parallel (auth methods)
- T057, T058, T061 can run in parallel (CLI commands, contract tests)

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch all US1 tests together:
Task: "Unit test LoginDetector in tests/unit/auth/login-detector.test.ts"
Task: "Unit test form-login method in tests/unit/auth/methods/form-login.test.ts"
Task: "Unit test Authenticator in tests/unit/auth/authenticator.test.ts"

# Launch independent implementations together:
Task: "Implement LoginDetector class in src/auth/login-detector.ts"
Task: "Implement form-login auth method in src/auth/methods/form-login.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (email/password auth)
4. Complete Phase 4: User Story 2 (session persistence)
5. **STOP and VALIDATE**: Test single-role auth crawl end-to-end
6. Deploy/demo if ready - basic authenticated crawling works!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Single-role auth works (MVP!)
3. Add User Story 2 → Session persistence + fixtures
4. Add User Story 3 → Multi-role + denial tests (major feature)
5. Add User Story 4 → Cookie/token injection
6. Add User Story 5 → Custom scripts (advanced)
7. Polish phase for CLI utilities and final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (email/password)
   - Developer B: User Story 2 (session persistence)
   - Developer C: User Story 4 (cookie/token injection)
3. After US1+US2 merge: Developer D can start User Story 3 (multi-role)
4. User Story 5 can be done by anyone after foundation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **CRITICAL**: CredentialGuard must be validated at every integration point (T064)
