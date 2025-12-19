# Tasks: AI Context Option

**Input**: Design documents from `/specs/007-ai-context-option/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (per plan.md)

---

## Phase 1: Setup

**Purpose**: Create new context module structure

- [X] T001 Create context module directory at src/context/
- [X] T002 [P] Create types and constants in src/context/types.ts (ContextSourceType, ContextSource, ContextOptions, MergedContext, ContextLoaderResult, ContextError, constants)
- [X] T003 [P] Create ContextError class in src/context/errors.ts with codes FILE_NOT_FOUND, FILE_NOT_READABLE, INVALID_ENCODING, SIZE_EXCEEDED

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core context infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement mergeContextSources function in src/context/context-merger.ts (combines sources with headers, calculates total size, sets sizeWarning flag)
- [X] T005 Add userContext field to PromptContext interface in src/prompts/types.ts
- [X] T006 [P] Update page-analysis.md prompt in prompts/page-analysis.md to conditionally include userContext with {{#if userContext}} block
- [X] T007 [P] Update test-scenario-generation.md prompt in prompts/test-scenario-generation.md to conditionally include userContext
- [X] T008 [P] Update test-data-generation.md prompt in prompts/test-data-generation.md to conditionally include userContext

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Provide Context via File (Priority: P1) 🎯 MVP

**Goal**: Users can supply a context file via `--context` flag to provide additional AI guidance

**Independent Test**: Run `testarion crawl https://example.com --context testing-context.md` and verify file content appears in AI prompt

### Implementation for User Story 1

- [X] T009 [US1] Implement loadContextFromFile function in src/context/context-loader.ts (validate exists, check size, read UTF-8, throw ContextError on failure)
- [X] T010 [US1] Implement loadContext function in src/context/context-loader.ts for file source only (calls loadContextFromFile, creates ContextSource, merges, returns ContextLoaderResult)
- [X] T011 [US1] Create barrel export in src/context/index.ts exporting loadContext, types, and errors
- [X] T012 [US1] Add --context option to crawl command in src/cli/crawl.ts with description "Path to a context file (.md or .txt) with additional guidance for AI"
- [X] T013 [US1] Add --context option to generate-docs command in src/cli/generate-docs.ts
- [X] T014 [US1] Add --context option to generate-tests command in src/cli/generate-tests.ts
- [X] T015 [US1] Update crawl action handler in src/cli/crawl.ts to call loadContext(options), display warnings, pass userContext to AI functions
- [X] T016 [US1] Update generate-docs action handler in src/cli/generate-docs.ts to integrate context loading
- [X] T017 [US1] Update generate-tests action handler in src/cli/generate-tests.ts to integrate context loading
- [X] T018 [US1] Update analyzePage function in src/ai/anthropic-client.ts to accept optional userContext parameter and pass to prompt rendering
- [X] T019 [US1] Update analyzeFlowForTests function in src/ai/anthropic-client.ts to accept optional userContext parameter
- [X] T020 [US1] Update generateEnhancedTestData function in src/ai/anthropic-client.ts to accept optional userContext parameter

**Checkpoint**: User Story 1 complete - users can provide context via file with full error handling

---

## Phase 4: User Story 2 - Provide Context via Inline Text (Priority: P2)

**Goal**: Users can provide quick context via `--context-text` flag without creating a file

**Independent Test**: Run `testarion crawl https://example.com --context-text "Focus on checkout flow"` and verify text appears in AI prompt

### Implementation for User Story 2

- [X] T021 [US2] Extend loadContext function in src/context/context-loader.ts to handle contextText option (create inline ContextSource)
- [X] T022 [US2] Add --context-text option to crawl command in src/cli/crawl.ts with description "Inline context text to include in AI prompts"
- [X] T023 [P] [US2] Add --context-text option to generate-docs command in src/cli/generate-docs.ts
- [X] T024 [P] [US2] Add --context-text option to generate-tests command in src/cli/generate-tests.ts
- [X] T025 [US2] Verify combined context (file + inline) works correctly with proper header separation

**Checkpoint**: User Story 2 complete - users can use inline text and combine with file context

---

## Phase 5: User Story 3 - Environment Variable Context (Priority: P3)

**Goal**: Users can set TESTARION_CONTEXT environment variable for session-wide defaults

**Independent Test**: Set `TESTARION_CONTEXT="Always test logged-in state"` then run CLI without flags and verify context appears in AI prompt

### Implementation for User Story 3

- [X] T026 [US3] Extend loadContext function in src/context/context-loader.ts to check process.env.TESTARION_CONTEXT (create environment ContextSource if present)
- [X] T027 [US3] Ensure correct merge order: file → inline → environment (environment comes last)
- [X] T028 [US3] Verify all three sources combine correctly with proper headers

**Checkpoint**: User Story 3 complete - all context sources working together

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation

- [X] T029 [P] Update CLI help text for --context and --context-text options to include examples
- [X] T030 [P] Add context option documentation to README.md with usage examples
- [X] T031 Run quickstart.md validation scenarios manually
- [X] T032 Ensure all error messages match spec (actionable, include file path, include suggestion)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (File) must complete before US2 (Inline) - US2 extends loadContext
  - US2 (Inline) must complete before US3 (Environment) - US3 extends loadContext further
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 (extends loadContext function)
- **User Story 3 (P3)**: Depends on User Story 2 (extends loadContext function further)

### Within Each User Story

- Core module functions before CLI integration
- CLI options before action handler updates
- Action handler updates before AI function updates

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# Launch in parallel:
Task: T002 "Create types and constants in src/context/types.ts"
Task: T003 "Create ContextError class in src/context/errors.ts"
```

**Phase 2 (Foundational)**:
```bash
# Launch in parallel:
Task: T006 "Update page-analysis.md prompt"
Task: T007 "Update test-scenario-generation.md prompt"
Task: T008 "Update test-data-generation.md prompt"
```

**User Story 1**:
```bash
# CLI options can be added in parallel after T011:
Task: T012 "Add --context to crawl"
Task: T013 "Add --context to generate-docs"
Task: T014 "Add --context to generate-tests"
```

**Phase 6 (Polish)**:
```bash
# Launch in parallel:
Task: T029 "Update CLI help text"
Task: T030 "Add documentation to README.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: User Story 1 (T009-T020)
4. **STOP and VALIDATE**: Test file context with crawl command
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 (File context) → Test independently → MVP ready
3. Add User Story 2 (Inline text) → Test independently → Enhanced usability
4. Add User Story 3 (Environment var) → Test independently → Power user feature
5. Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User stories 2 and 3 extend the loadContext function - sequential dependency
- No test tasks included (not explicitly requested in spec)
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
