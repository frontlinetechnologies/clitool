# Implementation Plan: Authenticated Crawling & Testing

**Branch**: `006-auth-crawl` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-auth-crawl/spec.md`

## Summary

Enable crawling and test generation for authenticated sections of web applications by supporting multiple authentication methods (form login, cookie/token injection, storage state), maintaining session state across crawls, and generating role-based test suites with access denial verification. The crawler will perform an unauthenticated baseline pass first, then crawl as each configured role to tag pages by required authentication level.

## Technical Context

**Language/Version**: TypeScript 5.3 with strict mode (ES2022 target)
**Primary Dependencies**: Playwright 1.40+, @anthropic-ai/sdk, commander 11.x
**Storage**: File-based (JSON crawl results, Playwright storage state files)
**Testing**: Jest 29.x with ts-jest
**Target Platform**: Node.js 18+ (cross-platform: macOS, Linux, Windows)
**Project Type**: Single CLI package
**Performance Goals**: Crawl 100+ pages per role without memory issues; authentication within 30 seconds
**Constraints**: No credential exposure in any output; silent re-auth on session timeout
**Scale/Scope**: Support unlimited roles; typical usage 1-5 roles per crawl

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check (Phase 0)

| Article | Status | Notes |
|---------|--------|-------|
| I. Simplicity First | ✅ PASS | Default behavior: crawl unauthenticated. Auth config optional. |
| II. Zero Configuration Start | ✅ PASS | Auth is opt-in; unauthenticated crawl works without config |
| III. Transparent Operations | ✅ PASS | Auth events logged (without credentials); progress indicators maintained |
| IV. Playwright Compatibility | ✅ PASS | Uses Playwright storage state, browser contexts, standard APIs |
| V. Modular Architecture | ✅ PASS | Auth module isolated; integrates with existing crawler via composition |
| VI. Dependency Minimalism | ✅ PASS | No new dependencies required; uses existing Playwright |
| VII. Cross-Platform Consistency | ✅ PASS | File paths via Node.js path module; env vars standard |
| VIII. Test Coverage | ✅ PASS | Unit tests for auth logic; integration tests for crawl flows |
| IX. Documentation as Code | ✅ PASS | CLI help updated; examples in quickstart |
| X. Community-Friendly Development | ✅ PASS | Clear contribution path for new auth methods |

**Gate Result**: PASS - No violations require justification.

### Post-Design Re-Check (Phase 1)

| Article | Status | Verification |
|---------|--------|--------------|
| I. Simplicity First | ✅ PASS | CLI: `--auth-role` single flag for simple cases; config file for advanced |
| II. Zero Configuration Start | ✅ PASS | Storage state injection works with just `--storage-state <path>` |
| III. Transparent Operations | ✅ PASS | `CredentialGuard` ensures no secret leakage; `AuthEvent` logs audit trail |
| IV. Playwright Compatibility | ✅ PASS | All auth methods use standard Playwright APIs (contexts, storage state) |
| V. Modular Architecture | ✅ PASS | `src/auth/` fully isolated; `methods/` submodule for extensibility |
| VI. Dependency Minimalism | ✅ PASS | Zero new dependencies in data-model or contracts |
| VII. Cross-Platform Consistency | ✅ PASS | Config uses JSON; env vars for credentials; Node.js path module |
| VIII. Test Coverage | ✅ PASS | Test structure defined: unit/, integration/, contract/ with auth coverage |
| IX. Documentation as Code | ✅ PASS | quickstart.md, CLI contract, API contracts all generated |
| X. Community-Friendly Development | ✅ PASS | `methods/` folder pattern allows community auth method contributions |

**Post-Design Gate Result**: PASS - Design maintains constitution compliance.

## Project Structure

### Documentation (this feature)

```text
specs/006-auth-crawl/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── auth/                    # NEW: Authentication module
│   ├── index.ts             # Public exports
│   ├── types.ts             # Auth config types, role definitions
│   ├── authenticator.ts     # Main authentication orchestrator
│   ├── methods/             # Auth method implementations
│   │   ├── form-login.ts    # Email/password form authentication
│   │   ├── cookie-injection.ts
│   │   ├── token-injection.ts
│   │   ├── storage-state.ts # Playwright storage state
│   │   └── custom-script.ts # User-provided scripts
│   ├── session-manager.ts   # Session state persistence, re-auth
│   ├── login-detector.ts    # Auto-detect login forms
│   └── credential-guard.ts  # Prevent credential leakage
├── crawler/
│   ├── crawler.ts           # MODIFY: Add auth context support
│   ├── page-processor.ts    # MODIFY: Accept browser context
│   ├── crawl-config.ts      # MODIFY: Add auth config
│   └── multi-role-crawler.ts # NEW: Orchestrate role-based crawls
├── models/
│   ├── page.ts              # MODIFY: Add authLevel field
│   └── role.ts              # NEW: Role model with privilege rank
├── test-generation/
│   ├── auth-fixtures.ts     # NEW: Generate auth test fixtures
│   ├── denial-tests.ts      # NEW: Generate access denial tests
│   └── logout-tests.ts      # NEW: Generate logout tests
└── utils/
    └── config-loader.ts     # MODIFY: Load auth config

tests/
├── unit/
│   └── auth/
│       ├── authenticator.test.ts
│       ├── login-detector.test.ts
│       ├── credential-guard.test.ts
│       └── session-manager.test.ts
├── integration/
│   └── auth-crawl.test.ts
└── contract/
    └── auth-config.test.ts
```

**Structure Decision**: Single project structure maintained. New `src/auth/` module added following existing patterns (models/, utils/, crawler/). Auth logic isolated behind clear interfaces per Article V.

## Complexity Tracking

> No violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
