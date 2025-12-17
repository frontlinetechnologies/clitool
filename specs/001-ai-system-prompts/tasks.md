# Tasks: AI System Prompts

**Input**: Design documents from `/specs/001-ai-system-prompts/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested for this feature - no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Prompts directory: `prompts/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and module structure

- [X] T001 Create prompts module directory structure at src/prompts/
- [X] T002 [P] Create type definitions in src/prompts/types.ts
- [X] T003 [P] Create error types and factory in src/prompts/errors.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core prompt infrastructure that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement template engine with variable substitution in src/prompts/template-engine.ts
- [X] T005 Implement YAML frontmatter parser and validator in src/prompts/prompt-validator.ts
- [X] T006 Implement prompt loader with caching and fallback in src/prompts/prompt-loader.ts
- [X] T007 Create public API exports in src/prompts/index.ts
- [X] T008 [P] Create default prompt file prompts/defaults/page-analysis.md
- [X] T009 [P] Create default prompt file prompts/defaults/test-scenario-generation.md
- [X] T010 [P] Create default prompt file prompts/defaults/test-data-generation.md

**Checkpoint**: Prompt module ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View and Understand System Prompts (Priority: P1) 🎯 MVP

**Goal**: Users can easily find and read AI system prompts to understand what instructions the AI receives

**Independent Test**: Navigate to prompts/ directory, open any prompt file, verify it's readable with clear documentation explaining purpose, variables, and usage

### Implementation for User Story 1

- [X] T011 [US1] Ensure prompts/defaults/ directory is included in package.json files array in package.json
- [X] T012 [US1] Add verbose logging for prompt loading events in src/prompts/prompt-loader.ts
- [X] T013 [US1] Verify each default prompt has complete frontmatter with name, version, description, max_tokens, and variables documentation

**Checkpoint**: User Story 1 complete - prompts are discoverable, readable, and self-documenting

---

## Phase 4: User Story 2 - Customize System Prompts (Priority: P2)

**Goal**: Users can edit prompts to customize AI behavior for their specific needs

**Independent Test**: Modify a prompt file, run CLI tool's AI feature, verify AI output reflects the changes

### Implementation for User Story 2

- [X] T014 [US2] Implement prompt initialization that copies defaults to user-editable prompts/ on first use in src/prompts/prompt-loader.ts
- [X] T015 [US2] Update analyzePage function to use prompt loader in src/ai/anthropic-client.ts
- [X] T016 [US2] Update analyzeFlowForTests function to use prompt loader in src/ai/anthropic-client.ts
- [X] T017 [US2] Update generateEnhancedTestData function to use prompt loader in src/ai/anthropic-client.ts
- [X] T018 [US2] Implement validation error messages with actionable suggestions in src/prompts/prompt-validator.ts

**Checkpoint**: User Story 2 complete - customized prompts are loaded and used by AI features

---

## Phase 5: User Story 3 - Reset Prompts to Defaults (Priority: P3)

**Goal**: Users can restore default prompts to recover from problematic customizations

**Independent Test**: Modify a prompt, run reset command, verify prompt returns to default state

### Implementation for User Story 3

- [X] T019 [US3] Create reset-prompts CLI command with commander in src/cli/reset-prompts.ts
- [X] T020 [US3] Implement --list option to show available prompts and their status in src/cli/reset-prompts.ts
- [X] T021 [US3] Implement selective reset (single prompt by name) in src/cli/reset-prompts.ts
- [X] T022 [US3] Implement --force flag to skip confirmation prompts in src/cli/reset-prompts.ts
- [X] T023 [US3] Add reset-prompts command to bin in package.json

**Checkpoint**: User Story 3 complete - reset functionality works for all and individual prompts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and cleanup

- [X] T024 [P] Add verbose mode support to all prompt operations
- [X] T025 Ensure cross-platform path handling using path.join throughout src/prompts/
- [X] T026 Run build and verify no TypeScript errors
- [X] T027 Run lint and fix any issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories should proceed sequentially in priority order (P1 → P2 → P3)
  - US2 depends on US1 (prompts must be discoverable before they can be customized)
  - US3 depends on US2 (reset only needed after customization is possible)
- **Polish (Phase 6)**: Depends on all user stories being complete

### Within Each Phase

- T001 → T002, T003 (directory before files)
- T004, T005 → T006 (template engine and validator before loader)
- T006 → T007 (loader before exports)
- T008, T009, T010 can run in parallel (independent files)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - establishes discoverability
- **User Story 2 (P2)**: Requires US1 complete - customization requires findable prompts
- **User Story 3 (P3)**: Requires US2 complete - reset requires customization capability

### Parallel Opportunities

**Phase 1:**
- T002 and T003 can run in parallel (different files)

**Phase 2:**
- T008, T009, T010 can run in parallel (independent prompt files)

**Phase 6:**
- T024 can run in parallel with other polish tasks

---

## Parallel Example: Foundational Phase

```bash
# After T004, T005, T006, T007 complete sequentially:
# Launch all default prompt creation tasks together:
Task: "Create default prompt file prompts/defaults/page-analysis.md"
Task: "Create default prompt file prompts/defaults/test-scenario-generation.md"
Task: "Create default prompt file prompts/defaults/test-data-generation.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify prompts are discoverable and readable
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Prompt module ready
2. Add User Story 1 → Test discoverability → Deploy (MVP!)
3. Add User Story 2 → Test customization → Deploy
4. Add User Story 3 → Test reset → Deploy
5. Each story adds value without breaking previous stories

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 27 |
| **Setup Tasks** | 3 |
| **Foundational Tasks** | 7 |
| **User Story 1 Tasks** | 3 |
| **User Story 2 Tasks** | 5 |
| **User Story 3 Tasks** | 5 |
| **Polish Tasks** | 4 |
| **Parallel Opportunities** | 6 tasks marked [P] |

### MVP Scope

User Story 1 (View and Understand System Prompts) delivers:
- Prompt module structure
- Default prompts with documentation
- Discoverable location at prompts/defaults/

This provides immediate value by making AI behavior transparent and understandable.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No test tasks included as tests were not explicitly requested in the specification
