# Tasks: Generate Site Documentation

**Input**: Design documents from `/specs/002-generate-docs/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included to ensure quality and meet Article VIII (80% coverage requirement).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow plan.md structure: `src/cli/`, `src/documentation/`, `src/ai/`, `src/models/`, `src/utils/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [X] T001 [P] Install @anthropic-ai/sdk dependency in package.json
- [X] T002 [P] Create src/documentation/ directory structure
- [X] T003 [P] Create src/ai/ directory structure
- [X] T004 [P] Create tests/unit/documentation/ directory structure
- [X] T005 [P] Create tests/unit/ai/ directory structure
- [X] T006 [P] Create tests/integration/documentation/ directory structure
- [X] T007 [P] Create tests/fixtures/crawl-results/ directory for sample crawl result JSON files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create Anthropic API client wrapper in src/ai/anthropic-client.ts (initialize client with ANTHROPIC_API_KEY env var, handle errors gracefully, return null on failure)
- [X] T009 [P] Create crawl results input parser in src/documentation/crawl-results-parser.ts (read JSON from stdin, validate schema, parse into typed objects)
- [X] T010 [P] Create documentation models in src/documentation/models.ts (Documentation, DocumentationSummary, SiteStructure, NavigationPath, UserFlow, PageDetail types/interfaces)
- [X] T011 Create base error handling for documentation generation in src/documentation/errors.ts (DocumentationError class, error types)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Generate Documentation from Crawl Results (Priority: P1) 🎯 MVP

**Goal**: Implement core documentation generation that processes crawl results and produces Markdown documentation. This delivers the minimum viable product - a working command that generates documentation from crawl results.

**Independent Test**: Run `crawl https://example.com | generate-docs` and verify the tool produces Markdown documentation describing the site structure. The command should complete successfully and output Markdown to stdout or file.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T012 [P] [US1] Unit test for crawl results parser in tests/unit/documentation/crawl-results-parser.test.ts (test JSON parsing, schema validation, error handling)
- [X] T013 [P] [US1] Unit test for markdown formatter in tests/unit/documentation/markdown-formatter.test.ts (test Markdown generation, formatting, structure)
- [X] T014 [P] [US1] Integration test for basic documentation generation in tests/integration/documentation/generate-docs.test.ts (test end-to-end pipeline with sample crawl results)

### Implementation for User Story 1

- [X] T015 [P] [US1] Implement markdown formatter in src/documentation/markdown-formatter.ts (convert documentation objects to Markdown strings, handle empty results)
- [X] T016 [US1] Implement basic documentation generator in src/documentation/doc-generator.ts (orchestrate parsing, generation, formatting, handle empty results per FR-015)
- [X] T017 [US1] Implement CLI command in src/cli/generate-docs.ts (commander setup, read from stdin, output to stdout or file per FR-006)
- [X] T018 [US1] Add file output handling in src/cli/generate-docs.ts (--output flag, validate writable per FR-016, overwrite with warning per FR-019)
- [X] T019 [US1] Add empty results handling in src/documentation/doc-generator.ts (generate minimal documentation with message per FR-015)
- [X] T020 [US1] Add error handling for invalid JSON input, file write errors in src/cli/generate-docs.ts
- [X] T021 [US1] Update package.json bin field to include generate-docs command

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Running `crawl <url> | generate-docs` should produce basic Markdown documentation.

---

## Phase 4: User Story 2 - Document Site Structure and Navigation (Priority: P2)

**Goal**: Extend documentation generation to clearly describe site structure and navigation paths. This adds significant value by providing a clear map of the application structure.

**Independent Test**: Generate documentation from crawl results with pages at different URL depths and links between pages, verify the tool accurately represents page relationships and navigation paths in the Markdown output.

### Tests for User Story 2

- [X] T022 [P] [US2] Unit test for structure analyzer in tests/unit/documentation/structure-analyzer.test.ts (test URL pattern grouping, hierarchy building, section detection)
- [X] T023 [P] [US2] Unit test for navigation path extraction in tests/unit/documentation/structure-analyzer.test.ts (test link relationship analysis, path building)
- [X] T024 [P] [US2] Integration test for structure documentation in tests/integration/documentation/structure.test.ts (test structure generation with sample crawl results)

### Implementation for User Story 2

- [X] T025 [P] [US2] Implement structure analyzer in src/documentation/structure-analyzer.ts (analyze URL patterns, build hierarchy tree, group into sections per FR-010)
- [X] T026 [US2] Add navigation path extraction in src/documentation/structure-analyzer.ts (extract link relationships, build navigation sequences per FR-004)
- [X] T027 [US2] Add home page detection in src/documentation/structure-analyzer.ts (identify entry point, mark clearly per acceptance scenario)
- [X] T028 [US2] Integrate structure analysis into doc-generator.ts (call structure analyzer, include results in documentation per FR-003, FR-004)
- [X] T029 [US2] Update markdown formatter to include site structure section (format SiteStructure, sections, hierarchy)
- [X] T030 [US2] Update markdown formatter to include navigation paths section (format NavigationPath array)

**Checkpoint**: At this point, User Story 2 should be complete. Documentation should include site structure and navigation paths sections.

---

## Phase 5: User Story 3 - Identify Critical User Flows (Priority: P3)

**Goal**: Extend documentation generation to identify and describe critical user flows (login, checkout, form submissions). This adds value by highlighting the most important user interactions.

**Independent Test**: Generate documentation from crawl results containing login forms, checkout forms, and multi-page form flows, verify the tool correctly identifies and documents these flows in the Markdown output.

### Tests for User Story 3

- [X] T031 [P] [US3] Unit test for flow detector in tests/unit/documentation/flow-detector.test.ts (test login flow detection, checkout flow detection, form submission flow detection)
- [X] T032 [P] [US3] Unit test for flow prioritization in tests/unit/documentation/flow-detector.test.ts (test priority scoring based on form complexity and page importance)
- [X] T033 [P] [US3] Integration test for flow documentation in tests/integration/documentation/flows.test.ts (test flow identification and documentation with sample crawl results)

### Implementation for User Story 3

- [X] T034 [P] [US3] Implement flow detector in src/documentation/flow-detector.ts (detect login flows per FR-011, checkout flows per FR-012, form submission flows per FR-013)
- [X] T035 [US3] Add login flow detection logic in src/documentation/flow-detector.ts (detect password fields + email/username fields per data-model patterns)
- [X] T036 [US3] Add checkout flow detection logic in src/documentation/flow-detector.ts (detect payment fields, checkout URLs per data-model patterns)
- [X] T037 [US3] Add form submission flow detection logic in src/documentation/flow-detector.ts (group forms by action URL, trace navigation paths)
- [X] T038 [US3] Add flow prioritization in src/documentation/flow-detector.ts (score flows by form complexity and page importance per FR-014)
- [X] T039 [US3] Integrate flow detection into doc-generator.ts (call flow detector, include results in documentation per FR-005)
- [X] T040 [US3] Update markdown formatter to include critical flows section (format UserFlow array with pages and descriptions)

**Checkpoint**: At this point, User Story 3 should be complete. Documentation should include critical user flows section.

---

## Phase 6: AI Integration (Enhancement)

**Purpose**: Add AI-powered page descriptions using Anthropic API

**Note**: This phase enhances User Story 1 but can be implemented after core functionality is working.

### Tests for AI Integration

- [X] T041 [P] Unit test for Anthropic client in tests/unit/ai/anthropic-client.test.ts (test API initialization, error handling, fallback behavior)
- [X] T042 [P] Integration test for AI page analysis in tests/integration/documentation/ai-analysis.test.ts (test API calls with mock responses, fallback on errors)

### Implementation for AI Integration

- [X] T043 [P] Enhance Anthropic client in src/ai/anthropic-client.ts (add page analysis method, build prompts, handle responses per FR-007)
- [X] T044 Add page analysis orchestration in src/documentation/doc-generator.ts (call AI API for each page, handle unavailability per FR-009, fallback per FR-008)
- [X] T045 Add AI description to PageDetail in src/documentation/doc-generator.ts (include AI-generated descriptions when available)
- [X] T046 Update markdown formatter to include AI-generated page descriptions in page details section
- [X] T047 Add rate limiting/throttling for AI API calls in src/documentation/doc-generator.ts (sequential processing to respect API limits)

**Checkpoint**: AI integration complete. Documentation should include AI-generated page descriptions when API is available.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, edge case handling, and documentation updates

- [X] T048 Add handling for malformed crawl results in src/documentation/crawl-results-parser.ts (graceful degradation, partial parsing)
- [X] T049 Add handling for circular navigation paths in src/documentation/structure-analyzer.ts (detect cycles, prevent infinite loops)
- [X] T050 Add handling for pages from multiple domains in src/documentation/structure-analyzer.ts (group by domain or filter to primary domain)
- [X] T051 Add handling for pages with no title or minimal content in src/documentation/doc-generator.ts (use URL-based descriptions)
- [X] T052 Add handling for crawl results with only error pages in src/documentation/doc-generator.ts (document error pages, explain limitations)
- [X] T053 Add memory-efficient processing for large crawl results in src/documentation/doc-generator.ts (stream processing if needed per FR-018)
- [X] T054 Update README.md with generate-docs command documentation and examples
- [X] T055 Add CLI help text for generate-docs command in src/cli/generate-docs.ts (description, examples, options)
- [X] T056 Add code comments explaining "why" not "what" in all new modules per Article IX

**Checkpoint**: Feature complete and polished. All edge cases handled, documentation updated.

---

## Dependencies & Story Completion Order

### Story Dependencies

```
US1 (P1) → US2 (P2) → US3 (P3)
   ↓           ↓           ↓
  MVP      Structure   Flows
```

- **US1** (P1) is the MVP and must be completed first
- **US2** (P2) depends on US1 (uses basic documentation generation)
- **US3** (P3) depends on US1 and US2 (uses structure analysis for flow detection)
- **AI Integration** can be implemented in parallel with US2/US3 or after

### Parallel Execution Opportunities

**Within Phase 3 (US1)**:
- T012, T013, T014 (tests) can run in parallel
- T015 (markdown formatter) can be done independently
- T017, T018 (CLI) can be done after T016

**Within Phase 4 (US2)**:
- T022, T023, T024 (tests) can run in parallel
- T025 (structure analyzer) can be done independently
- T029, T030 (markdown updates) can be done in parallel

**Within Phase 5 (US3)**:
- T031, T032, T033 (tests) can run in parallel
- T034-T038 (flow detector) can be done incrementally
- T040 (markdown update) can be done after T039

**Cross-Phase Parallel**:
- Phase 6 (AI Integration) can be done in parallel with Phase 4/5
- Phase 7 (Polish) can be done incrementally as other phases complete

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Focus**: User Story 1 only
- Basic documentation generation from crawl results
- Markdown output to stdout or file
- Empty results handling
- Core CLI command

**Deliverable**: Working `generate-docs` command that produces basic Markdown documentation.

### Incremental Delivery

1. **Sprint 1**: Phase 1-2 (Setup + Foundation)
2. **Sprint 2**: Phase 3 (US1 - MVP)
3. **Sprint 3**: Phase 4 (US2 - Structure)
4. **Sprint 4**: Phase 5 (US3 - Flows)
5. **Sprint 5**: Phase 6 (AI Integration)
6. **Sprint 6**: Phase 7 (Polish)

### Independent Test Criteria

**US1**: Run `crawl https://example.com | generate-docs` → produces Markdown with site summary
**US2**: Generate docs from crawl with nested URLs → includes structure and navigation sections
**US3**: Generate docs from crawl with login/checkout forms → includes critical flows section

---

## Task Summary

- **Total Tasks**: 56
- **Setup Tasks**: 7 (Phase 1)
- **Foundation Tasks**: 4 (Phase 2)
- **US1 Tasks**: 10 (Phase 3) - MVP
- **US2 Tasks**: 9 (Phase 4)
- **US3 Tasks**: 10 (Phase 5)
- **AI Integration Tasks**: 7 (Phase 6)
- **Polish Tasks**: 9 (Phase 7)

**Parallel Opportunities**: ~40% of tasks can run in parallel (marked with [P])

**Suggested MVP**: Complete Phases 1-3 (US1) for initial release, then iterate with US2, US3, and AI integration.

