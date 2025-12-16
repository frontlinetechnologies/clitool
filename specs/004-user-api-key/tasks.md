# Tasks: Provide Own AI API Key

**Input**: Design documents from `/specs/004-user-api-key/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included to ensure quality and meet Article VIII (80% coverage requirement).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow plan.md structure: `src/utils/`, `src/cli/`, `src/ai/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 [P] Create src/utils/config-loader.ts module file with basic structure
- [X] T002 [P] Create tests/unit/utils/ directory structure
- [X] T003 [P] Create tests/integration/ directory structure if it doesn't exist
- [X] T004 [P] Verify Node.js fs, path, and os modules are available (native, no installation needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create ConfigFile interface and ConfigError class in src/utils/config-loader.ts (define ConfigFile interface with anthropicApiKey?: string, ConfigError extends Error with filePath and cause properties)
- [X] T006 [P] Implement getProjectConfigPath() function in src/utils/config-loader.ts (returns absolute path to .testarion/config.json using path.join(process.cwd(), '.testarion', 'config.json'))
- [X] T007 [P] Implement getGlobalConfigPath() function in src/utils/config-loader.ts (returns absolute path to ~/.testarion/config.json using path.join(os.homedir(), '.testarion', 'config.json'))
- [X] T008 [P] Implement validateApiKeyFormat() function in src/utils/config-loader.ts (validates key starts with 'sk-ant-' prefix, trims whitespace, returns boolean)
- [X] T009 Create module-level state variable for prompt tracking in src/utils/config-loader.ts (promptShownThisSession: boolean, initialized to false)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 3 - Configure API Key via Configuration File (Priority: P2) 🎯 MVP

**Goal**: Implement configuration file support so users can store their API key in project-level or global config files, eliminating the need to provide it on every command invocation.

**Independent Test**: Create a config file at `.testarion/config.json` with `{"anthropicApiKey": "sk-ant-test-key"}`, run `generate-tests` without CLI param or env var, verify the tool uses the key from the configuration file and AI features work.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [P] [US3] Unit test for readConfigFile() in tests/unit/utils/config-loader.test.ts (test reading valid config file, missing file returns null, invalid JSON throws ConfigError, trims whitespace from key)
- [X] T011 [P] [US3] Unit test for writeConfigFile() in tests/unit/utils/config-loader.test.ts (test creating new config file, updating existing config preserves other fields, sets permissions to 0o600, creates directory if needed)
- [X] T012 [P] [US3] Unit test for resolveApiKey() priority order in tests/unit/utils/config-loader.test.ts (test CLI > env > project config > global config priority, returns first non-empty key found)
- [X] T013 [P] [US3] Unit test for getProjectConfigPath() and getGlobalConfigPath() in tests/unit/utils/config-loader.test.ts (test path resolution, cross-platform compatibility)
- [X] T014 [P] [US3] Integration test for config file scenarios in tests/integration/config-file.test.ts (test project config takes precedence over global, missing config files handled gracefully, config file with syntax errors handled)

### Implementation for User Story 3

- [X] T015 [P] [US3] Implement readConfigFile() function in src/utils/config-loader.ts (read JSON file, parse with JSON.parse, extract anthropicApiKey field, trim whitespace, return null if file doesn't exist, throw ConfigError on parse errors)
- [X] T016 [US3] Implement writeConfigFile() function in src/utils/config-loader.ts (create .testarion directory if needed with fs.mkdirSync recursive, read existing config if exists, update anthropicApiKey field, write JSON with fs.writeFileSync, set file permissions to 0o600 with fs.chmodSync, set directory permissions to 0o700)
- [X] T017 [US3] Implement resolveApiKey() function in src/utils/config-loader.ts (check CLI param first, then env var, then project config via readConfigFile(getProjectConfigPath()), then global config via readConfigFile(getGlobalConfigPath()), trim whitespace from all sources, return first non-empty key or null)
- [X] T018 [US3] Implement shouldPromptToSave() function in src/utils/config-loader.ts (returns true if key provided via CLI/env var, no config file exists at project or global location, promptShownThisSession is false)
- [X] T019 [US3] Integrate resolveApiKey() into src/cli/generate-docs.ts (replace direct env var access with resolveApiKey(options.anthropicApiKey), pass resolved key to AI client functions)
- [X] T020 [US3] Integrate resolveApiKey() into src/cli/generate-tests.ts (replace direct env var access with resolveApiKey(options.anthropicApiKey), pass resolved key to AI client functions)
- [X] T021 [US3] Add prompt-to-save functionality in src/cli/generate-docs.ts (check shouldPromptToSave(), prompt user to choose project/global location, call writeConfigFile() if confirmed, set promptShownThisSession to true)
- [X] T022 [US3] Add prompt-to-save functionality in src/cli/generate-tests.ts (check shouldPromptToSave(), prompt user to choose project/global location, call writeConfigFile() if confirmed, set promptShownThisSession to true)
- [X] T023 [US3] Update CLI help text in src/cli/generate-docs.ts (add mention of config file option in help text)
- [X] T024 [US3] Update CLI help text in src/cli/generate-tests.ts (add mention of config file option in help text)

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently. Users can create config files and the tool will use them automatically.

---

## Phase 4: User Story 4 - API Key Validation (Priority: P2)

**Goal**: Implement format validation for API keys before making API calls, providing immediate feedback on configuration errors instead of cryptic API failures.

**Independent Test**: Provide an invalid API key (not starting with 'sk-ant-') via any method (CLI, env var, or config file), run any AI-enhanced command, verify the tool displays a clear format error message without making API calls.

### Tests for User Story 4

- [X] T025 [P] [US4] Unit test for validateApiKeyFormat() edge cases in tests/unit/utils/config-loader.test.ts (test empty string, whitespace-only, invalid prefix, valid prefix with whitespace trimming)
- [X] T026 [P] [US4] Unit test for format validation in resolveApiKey() in tests/unit/utils/config-loader.test.ts (test invalid format throws ConfigError with clear message, validation happens after resolution)
- [X] T027 [P] [US4] Integration test for format validation in tests/integration/config-file.test.ts (test invalid key in config file shows format error, invalid key via CLI shows format error, invalid key via env var shows format error)

### Implementation for User Story 4

- [X] T028 [US4] Enhance validateApiKeyFormat() in src/utils/config-loader.ts (ensure it trims whitespace before validation, handles empty strings correctly)
- [X] T029 [US4] Add format validation to resolveApiKey() in src/utils/config-loader.ts (after resolving key, validate format with validateApiKeyFormat(), throw ConfigError with message "Invalid API key format. Anthropic keys start with 'sk-ant-'." if invalid)
- [ ] T030 [US4] Update src/ai/anthropic-client.ts initializeClient() to validate format before creating client (call validateApiKeyFormat() if key provided, throw ConfigError if invalid before creating Anthropic client)
- [X] T031 [US4] Add format validation error handling in src/cli/generate-docs.ts (catch ConfigError from resolveApiKey(), display user-friendly error message, exit with code 1)
- [X] T032 [US4] Add format validation error handling in src/cli/generate-tests.ts (catch ConfigError from resolveApiKey(), display user-friendly error message, exit with code 1)

**Checkpoint**: At this point, User Story 4 should be complete. Invalid API key formats are caught and reported before any API calls are made.

---

## Phase 5: User Story 5 - Clear Error Messages (Priority: P2)

**Goal**: Improve error messages for API key configuration issues, making them clear, actionable, and user-friendly to reduce debugging time.

**Independent Test**: Trigger various error conditions (missing key with --verbose, invalid key format, API authentication error, rate limit error) and verify messages are user-friendly and actionable.

### Tests for User Story 5

- [X] T033 [P] [US5] Unit test for error messages in tests/unit/utils/config-loader.test.ts (test ConfigError messages include file paths when relevant, error messages are user-friendly)
- [X] T034 [P] [US5] Integration test for error message scenarios in tests/integration/config-file.test.ts (test missing key with --verbose shows guidance, invalid format shows format error, config file parse error shows file location)

### Implementation for User Story 5

- [X] T035 [US5] Enhance ConfigError class in src/utils/config-loader.ts (ensure error messages are user-friendly, include file paths when file operations fail)
- [X] T036 [US5] Add missing key guidance in src/cli/generate-docs.ts (when resolveApiKey() returns null and --verbose flag is set, display message explaining how to configure API key: "No API key configured. Set ANTHROPIC_API_KEY, use --anthropic-api-key, or create config file at .testarion/config.json or ~/.testarion/config.json")
- [X] T037 [US5] Add missing key guidance in src/cli/generate-tests.ts (when resolveApiKey() returns null and --verbose flag is set, display message explaining how to configure API key)
- [ ] T038 [US5] Enhance API error handling in src/ai/anthropic-client.ts analyzePage() (catch authentication errors, throw ConfigError with message "Invalid API key. Please verify your Anthropic API key is correct.")
- [ ] T039 [US5] Enhance API error handling in src/ai/anthropic-client.ts analyzeFlowForTests() (catch authentication errors, throw ConfigError with message "Invalid API key. Please verify your Anthropic API key is correct.")
- [ ] T040 [US5] Add rate limit error handling in src/ai/anthropic-client.ts analyzePage() (catch rate limit/quota errors, display message explaining issue and suggesting to wait or check usage limits)
- [ ] T041 [US5] Add rate limit error handling in src/ai/anthropic-client.ts analyzeFlowForTests() (catch rate limit/quota errors, display message explaining issue)
- [ ] T042 [US5] Update error handling in src/cli/generate-docs.ts (catch ConfigError from AI client, display user-friendly message, differentiate between format errors and API errors)
- [ ] T043 [US5] Update error handling in src/cli/generate-tests.ts (catch ConfigError from AI client, display user-friendly message, differentiate between format errors and API errors)

**Checkpoint**: At this point, User Story 5 should be complete. All error conditions display clear, actionable messages.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T044 [P] Update README.md with config file examples (add section showing how to use config files, project-level vs global, examples from quickstart.md)
- [X] T045 [P] Add .testarion/ to .gitignore (prevent committing API keys to version control)
- [X] T046 Code cleanup and refactoring (ensure consistent error handling patterns, verify all functions follow API contract)
- [ ] T047 [P] Run quickstart.md validation (verify all examples in quickstart.md work correctly)
- [X] T048 Verify backward compatibility (test that existing CLI/env var methods still work, no breaking changes)
- [X] T049 [P] Additional unit tests for edge cases in tests/unit/utils/config-loader.test.ts (test concurrent access scenarios, permission errors, directory creation failures, home directory resolution failures)
- [X] T050 Security review (verify file permissions are set correctly, verify keys are not logged, verify config files are not exposed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (US3 → US4 → US5)
  - US4 and US5 can be worked on in parallel after US3 is complete
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (US1 and US2 already implemented)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Enhances US3 but can be implemented independently
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Enhances US3 and US4 but can be implemented independently

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core functions before integration
- Integration into CLI commands after core functions
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All tests for a user story marked [P] can run in parallel
- Core functions within a story marked [P] can run in parallel
- US4 and US5 can be worked on in parallel after US3 is complete

---

## Parallel Example: User Story 3

```bash
# Launch all tests for User Story 3 together:
Task: "Unit test for readConfigFile() in tests/unit/utils/config-loader.test.ts"
Task: "Unit test for writeConfigFile() in tests/unit/utils/config-loader.test.ts"
Task: "Unit test for resolveApiKey() priority order in tests/unit/utils/config-loader.test.ts"
Task: "Unit test for getProjectConfigPath() and getGlobalConfigPath() in tests/unit/utils/config-loader.test.ts"
Task: "Integration test for config file scenarios in tests/integration/config-file.test.ts"

# Launch core functions for User Story 3 together:
Task: "Implement readConfigFile() function in src/utils/config-loader.ts"
Task: "Implement writeConfigFile() function in src/utils/config-loader.ts"
Task: "Implement resolveApiKey() function in src/utils/config-loader.ts"
Task: "Implement shouldPromptToSave() function in src/utils/config-loader.ts"
```

---

## Implementation Strategy

### MVP First (User Story 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 3 (Config File Support)
4. **STOP and VALIDATE**: Test User Story 3 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 3 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 4 → Test independently → Deploy/Demo
4. Add User Story 5 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 3 (Config File Support)
   - Developer B: User Story 4 (Validation) - can start after T017
   - Developer C: User Story 5 (Error Messages) - can start after T017
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- User Stories 1 and 2 are already implemented (env var and CLI param support)
- Focus is on adding config file support (US3) and enhancing validation/error messages (US4, US5)

