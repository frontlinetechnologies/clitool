# Tasks: Generate End-to-End Tests

**Input**: Design documents from `/specs/003-generate-tests/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included to ensure quality and meet Article VIII (80% coverage requirement).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow plan.md structure: `src/cli/`, `src/test-generation/`, `src/documentation/`, `src/ai/`, `src/models/`, `src/utils/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 [P] Create src/test-generation/ directory structure
- [X] T002 [P] Create tests/unit/test-generation/ directory structure
- [X] T003 [P] Create tests/integration/test-generation/ directory structure
- [X] T004 [P] Create tests/fixtures/test-generation/ directory for sample test generation scenarios
- [X] T005 [P] Verify @playwright/test is in devDependencies (already installed per plan.md)
- [X] T006 [P] Update package.json bin field to include generate-tests command

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create crawl results input parser in src/test-generation/crawl-results-parser.ts (read JSON from stdin, validate schema, parse into typed objects, reuse patterns from documentation/crawl-results-parser.ts)
- [X] T008 [P] Create test generation models in src/test-generation/models.ts (GeneratedTestSuite, TestFile, TestCase, TestStep, Assertion, TestData, TestGenerationSummary, SpecificScenario types/interfaces per data-model.md)
- [X] T009 Create base error handling for test generation in src/test-generation/errors.ts (TestGenerationError class, error types)
- [X] T010 [P] Create test file organizer utility in src/test-generation/test-file-organizer.ts (organize test files by flow, handle naming conventions, one file per flow per FR-018)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Generate End-to-End Tests from Crawl Results (Priority: P1) 🎯 MVP

**Goal**: Implement core test generation that processes crawl results and produces valid Playwright test scripts. This delivers the minimum viable product - a working command that generates executable test files from crawl results.

**Independent Test**: Run `crawl https://example.com | generate-tests` and verify the tool produces valid Playwright test scripts that can be executed. The command should complete successfully and save test files to the default directory `./tests/generated/`.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [P] [US1] Unit test for crawl results parser in tests/unit/test-generation/crawl-results-parser.test.ts (test JSON parsing, schema validation, error handling)
- [X] T012 [P] [US1] Unit test for Playwright code generator in tests/unit/test-generation/playwright-codegen.test.ts (test test code generation, formatting, structure)
- [X] T013 [P] [US1] Unit test for test data generator in tests/unit/test-generation/test-data-generator.test.ts (test test data generation for different input types)
- [X] T014 [P] [US1] Integration test for basic test generation in tests/integration/test-generation/generate-tests.test.ts (test end-to-end pipeline with sample crawl results)

### Implementation for User Story 1

- [X] T015 [P] [US1] Implement test data generator in src/test-generation/test-data-generator.ts (generate test data for email, password, text, phone, credit card, coupon codes, dates per research.md patterns)
- [X] T016 [P] [US1] Implement Playwright code generator in src/test-generation/playwright-codegen.ts (generate TypeScript test code with imports, test.describe, test cases, assertions per research.md structure)
- [X] T017 [US1] Implement basic test generator orchestration in src/test-generation/test-generator.ts (orchestrate parsing, generation, formatting, handle empty results per FR-014)
- [X] T018 [US1] Implement CLI command in src/cli/generate-tests.ts (commander setup, read from stdin, --output-dir flag with default ./tests/generated/ per FR-003)
- [X] T019 [US1] Add output directory handling in src/cli/generate-tests.ts (create directory if needed, validate writable per FR-015, check for existing files per FR-016)
- [X] T020 [US1] Add empty results handling in src/test-generation/test-generator.ts (generate empty-results.spec.ts with explanation per FR-014)
- [X] T021 [US1] Add file overwrite warning in src/cli/generate-tests.ts (display warning before overwriting existing files per FR-016)
- [X] T022 [US1] Add error handling for invalid JSON input, file write errors in src/cli/generate-tests.ts
- [X] T023 [US1] Add basic navigation test generation in src/test-generation/test-generator.ts (generate navigation tests for pages without forms per FR-021)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Running `crawl <url> | generate-tests` should produce basic Playwright test files.

---

## Phase 4: User Story 2 - Generate Tests for Discovered User Flows (Priority: P2)

**Goal**: Extend test generation to cover discovered user flows such as navigation paths and form submissions. This adds significant value by ensuring critical user journeys are automatically tested.

**Independent Test**: Generate tests from crawl results containing navigation paths and forms, verify the tool correctly generates test cases covering these flows. The generated tests should navigate through paths and submit forms.

### Tests for User Story 2

- [X] T024 [P] [US2] Unit test for flow-based test generation in tests/unit/test-generation/test-generator.test.ts (test flow detection integration, test case generation for flows)
- [X] T025 [P] [US2] Integration test for flow test generation in tests/integration/test-generation/flows.test.ts (test test generation with login flows, checkout flows, form submission flows)

### Implementation for User Story 2

- [X] T026 [US2] Integrate flow detection into test generator in src/test-generation/test-generator.ts (reuse detectCriticalFlows from documentation/flow-detector.ts per research.md)
- [X] T027 [US2] Add navigation flow test generation in src/test-generation/test-generator.ts (generate navigation tests for flow pages per FR-006)
- [X] T028 [US2] Add form submission test generation in src/test-generation/test-generator.ts (generate form filling and submission tests per FR-007)
- [X] T029 [US2] Add login flow test generation in src/test-generation/test-generator.ts (generate login flow tests when password and email fields detected per FR-009)
- [X] T030 [US2] Add checkout flow test generation in src/test-generation/test-generator.ts (generate checkout flow tests when payment fields detected per FR-010)
- [X] T031 [US2] Add multi-step form flow test generation in src/test-generation/test-generator.ts (generate tests for multi-step forms per FR-011)
- [X] T032 [US2] Add assertion generation in src/test-generation/playwright-codegen.ts (generate appropriate assertions for navigation, form submission, login, checkout per FR-012)
- [X] T033 [US2] Update test file organizer to organize by flow in src/test-generation/test-file-organizer.ts (one file per flow, naming convention per FR-018)

**Checkpoint**: At this point, User Story 2 should be complete. Test generation should cover discovered user flows with appropriate test cases and assertions.

---

## Phase 5: User Story 3 - Generate Tests for Specific Scenarios (Priority: P3)

**Goal**: Extend test generation to include specific scenarios like coupon code entry when detected. This adds depth to the test suite beyond basic navigation and form submission.

**Independent Test**: Generate tests from crawl results containing specific input patterns (e.g., coupon codes), verify the tool correctly generates test cases for these scenarios within the appropriate flow files.

### Tests for User Story 3

- [X] T034 [P] [US3] Unit test for scenario detection in tests/unit/test-generation/test-generator.test.ts (test coupon code detection, scenario test case generation)
- [X] T035 [P] [US3] Integration test for scenario test generation in tests/integration/test-generation/scenarios.test.ts (test test generation with coupon code fields, specific scenarios)

### Implementation for User Story 3

- [X] T036 [US3] Add specific scenario detection in src/test-generation/test-generator.ts (detect coupon codes, promo codes, discount fields per FR-008)
- [X] T037 [US3] Add scenario test case generation in src/test-generation/test-generator.ts (generate test cases for detected scenarios per FR-008)
- [X] T038 [US3] Integrate scenarios into flow files in src/test-generation/test-generator.ts (include scenario tests within appropriate flow file per FR-008)
- [X] T039 [US3] Add scenario-specific test data generation in src/test-generation/test-data-generator.ts (generate coupon codes, promo codes per research.md patterns)
- [X] T040 [US3] Add scenario assertion generation in src/test-generation/playwright-codegen.ts (generate assertions for scenario behavior per acceptance scenario 5)

**Checkpoint**: At this point, User Story 3 should be complete. Test generation should include specific scenarios like coupon codes when detected.

---

## Phase 6: AI Integration (Enhancement)

**Purpose**: Add AI-powered test scenario enhancement using Anthropic API

**Note**: This phase enhances User Stories 1-3 but can be implemented after core functionality is working.

### Tests for AI Integration

- [X] T041 [P] Unit test for AI test enhancement in tests/unit/test-generation/ai-enhancement.test.ts (test AI API integration, fallback behavior per FR-013)
- [X] T042 [P] Integration test for AI-enhanced test generation in tests/integration/test-generation/ai-enhancement.test.ts (test AI enhancement with mock API responses, fallback on errors)

### Implementation for AI Integration

- [X] T043 [P] Enhance Anthropic client for test generation in src/ai/anthropic-client.ts (add test scenario analysis method, build prompts for test generation per FR-004, FR-020)
- [X] T044 Add AI test enhancement orchestration in src/test-generation/test-generator.ts (call AI API for test scenarios, handle unavailability per FR-013, fallback to pattern-based per FR-013)
- [X] T045 Add AI-enhanced test scenarios in src/test-generation/test-generator.ts (merge AI suggestions with pattern-based tests per research.md)
- [X] T046 Add AI-enhanced test data generation in src/test-generation/test-data-generator.ts (use AI for context-specific test data when available per research.md)
- [X] T047 Add AI-enhanced assertion generation in src/test-generation/playwright-codegen.ts (use AI for context-specific assertions per research.md)
- [X] T048 Add rate limiting/throttling for AI API calls in src/test-generation/test-generator.ts (sequential processing to respect API limits, batch efficiently per research.md)
- [X] T049 Add AI response caching in src/test-generation/test-generator.ts (cache AI responses during generation to avoid duplicate calls per research.md)

**Checkpoint**: AI integration complete. Test generation should include AI-enhanced scenarios when API is available, with graceful fallback.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, edge case handling, performance optimization, and documentation updates

- [X] T050 Add handling for malformed crawl results in src/test-generation/crawl-results-parser.ts (graceful degradation, partial parsing)
- [X] T051 Add handling for circular navigation paths in src/test-generation/test-generator.ts (detect cycles, generate tests that navigate through cycle once per edge cases)
- [X] T052 Add handling for pages from multiple domains in src/test-generation/test-generator.ts (filter to same domain as crawl start URL per edge cases)
- [X] T053 Add handling for error pages (4xx/5xx) in src/test-generation/test-generator.ts (skip or generate tests that verify error page display per edge cases)
- [X] T054 Add handling for pages with no forms or interactive elements in src/test-generation/test-generator.ts (generate basic navigation tests per FR-021)
- [X] T055 Add memory-efficient processing for large crawl results in src/test-generation/test-generator.ts (process flows incrementally, avoid loading all pages into memory per research.md)
- [X] T056 Add performance optimization for test generation in src/test-generation/test-generator.ts (target <10 minutes for 1000 pages per FR-017)
- [X] T057 Add summary generation in src/test-generation/test-generator.ts (generate TestGenerationSummary with counts per data-model.md)
- [X] T058 Add summary output display in src/cli/generate-tests.ts (display summary after generation completes)
- [X] T059 Update README.md with generate-tests command documentation and examples
- [X] T060 Add CLI help text for generate-tests command in src/cli/generate-tests.ts (description, examples, options per Article IX)
- [X] T061 Add code comments explaining "why" not "what" in all new modules per Article IX
- [X] T062 [P] Add unit tests for remaining test generation utilities in tests/unit/test-generation/ (test-file-organizer.test.ts, models.test.ts)
- [X] T063 Run quickstart.md validation (test all examples from quickstart.md work correctly)
- [X] T064 Verify 80% test coverage requirement (run coverage report, add tests if needed per Article VIII)
- [X] T065 Code cleanup and refactoring (remove unused code, improve naming, optimize)
- [X] T066 Security review (validate input, review dependencies, ensure API key security per research.md)

**Checkpoint**: Feature complete and polished. All edge cases handled, performance optimized, documentation updated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3)
  - Or in parallel if team capacity allows (after foundational)
- **AI Integration (Phase 6)**: Can be implemented in parallel with User Stories 2-3 or after
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs basic test generation to extend) - Can start after US1
- **User Story 3 (P3)**: Depends on US1, US2 (needs flow detection and test generation) - Can start after US1, US2

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before generators/orchestrators
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - US1 can start immediately
  - US2 must wait for US1
  - US3 must wait for US1 and US2
- All tests for a user story marked [P] can run in parallel
- Models and utilities within a story marked [P] can run in parallel
- AI Integration (Phase 6) can be done in parallel with US2/US3 or after
- Different user stories can be worked on in parallel by different team members (respecting dependencies)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for crawl results parser in tests/unit/test-generation/crawl-results-parser.test.ts"
Task: "Unit test for Playwright code generator in tests/unit/test-generation/playwright-codegen.test.ts"
Task: "Unit test for test data generator in tests/unit/test-generation/test-data-generator.test.ts"
Task: "Integration test for basic test generation in tests/integration/test-generation/generate-tests.test.ts"

# Launch utilities for User Story 1 together:
Task: "Implement test data generator in src/test-generation/test-data-generator.ts"
Task: "Implement Playwright code generator in src/test-generation/playwright-codegen.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch tests for User Story 2 together:
Task: "Unit test for flow-based test generation in tests/unit/test-generation/test-generator.test.ts"
Task: "Integration test for flow test generation in tests/integration/test-generation/flows.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

**MVP Deliverable**: Working test generator that produces valid Playwright test scripts from crawl results.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (with flow coverage)
4. Add User Story 3 → Test independently → Deploy/Demo (with scenario detection)
5. Add AI Integration → Test independently → Deploy/Demo (with AI enhancement)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP)
3. After US1 completes:
   - Developer A: User Story 2 (depends on US1)
   - Developer B: AI Integration prep or User Story 3 prep
4. After US1 and US2 complete:
   - Developer A: User Story 3 (depends on US1, US2)
   - Developer B: AI Integration (can work in parallel)
5. Both developers: Polish & optimization

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Reuse existing modules: flow-detector.ts, anthropic-client.ts, crawl-results-parser.ts patterns
- Total tasks: 66
- MVP scope: Phases 1-3 (Setup + Foundational + User Story 1)

