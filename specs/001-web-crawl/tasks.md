# Tasks: Crawl a Web Application

**Input**: Design documents from `/specs/001-web-crawl/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included to ensure quality and meet Article VIII (80% coverage requirement).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow plan.md structure: `src/cli/`, `src/crawler/`, `src/parsers/`, `src/output/`, `src/models/`, `src/utils/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan (src/cli/, src/crawler/, src/parsers/, src/output/, src/models/, src/utils/, tests/unit/, tests/integration/, tests/fixtures/)
- [X] T002 Initialize TypeScript project with package.json, tsconfig.json (strict mode enabled)
- [X] T003 [P] Install dependencies: playwright, cheerio, commander, robots-parser, @types/node, typescript
- [X] T004 [P] Install dev dependencies: jest, @types/jest, ts-jest, @playwright/test, eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin
- [X] T005 [P] Configure Jest in jest.config.js with TypeScript support
- [X] T006 [P] Configure ESLint in .eslintrc.js with TypeScript rules
- [X] T007 [P] Create .gitignore with node_modules/, dist/, coverage/, .env
- [X] T008 Create README.md with project description and installation instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create base error handling utilities in src/utils/errors.ts (CrawlError class, error types)
- [X] T010 [P] Create URL validation utility in src/utils/url-validator.ts (validate URL format, prevent SSRF)
- [X] T011 [P] Create domain extraction utility in src/utils/domain.ts (extract domain from URL, check same-domain)
- [X] T012 Create base logger utility in src/utils/logger.ts (structured logging, quiet mode support)
- [X] T013 [P] Create signal handler utility in src/utils/signals.ts (SIGINT/SIGTERM handling for graceful shutdown)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Web Crawl with URL (Priority: P1) 🎯 MVP

**Goal**: Implement core crawling functionality that discovers and maps all accessible pages starting from a provided URL. This delivers the minimum viable product - a working web crawler that can discover pages and output results.

**Independent Test**: Run `crawl https://example.com` and verify the tool discovers and reports all accessible pages. The crawl should complete successfully and output a JSON summary with page URLs.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014 [P] [US1] Unit test for URL normalizer in tests/unit/utils/url-normalizer.test.ts (test normalization, deduplication)
- [X] T015 [P] [US1] Unit test for page processor in tests/unit/crawler/page-processor.test.ts (test page discovery, link extraction)
- [X] T016 [P] [US1] Integration test for basic crawl flow in tests/integration/crawler.test.ts (test end-to-end crawl with mock server)

### Implementation for User Story 1

- [X] T017 [P] [US1] Create Page model in src/models/page.ts (url, status, title, discoveredAt, processedAt, links, error fields)
- [X] T018 [P] [US1] Create CrawlSummary model in src/models/crawl-summary.ts (totalPages, errors, skipped, interrupted, startTime, endTime, duration)
- [X] T019 [P] [US1] Implement URL normalizer in src/crawler/url-normalizer.ts (normalize trailing slashes, remove fragments, preserve query strings)
- [X] T020 [US1] Implement page processor in src/crawler/page-processor.ts (use Playwright to load page, extract HTML, discover links)
- [X] T021 [US1] Implement main crawler orchestration in src/crawler/crawler.ts (initialize crawl, queue management, page discovery loop)
- [X] T022 [US1] Implement progress reporter in src/utils/progress.ts (real-time progress updates with carriage return, quiet mode support)
- [X] T023 [US1] Implement JSON formatter in src/output/json-formatter.ts (format crawl results as JSON per schema)
- [X] T024 [US1] Implement CLI command in src/cli/crawl.ts (commander setup, URL argument, basic crawl execution)
- [X] T025 [US1] Add interruption handling in src/crawler/crawler.ts (listen for SIGINT/SIGTERM, save partial results on interrupt)
- [X] T026 [US1] Add error handling for network errors, invalid URLs, unreachable pages in src/crawler/crawler.ts
- [X] T027 [US1] Add redirect handling (follow same-domain redirects, skip external) in src/crawler/page-processor.ts
- [X] T028 [US1] Add infinite redirect loop detection in src/crawler/crawler.ts (track redirect chain, detect cycles)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Running `crawl <url>` should discover pages and output JSON results.

---

## Phase 4: User Story 2 - Identify Interactive Elements (Priority: P2)

**Goal**: Extend the crawler to identify and catalog all forms, buttons, and input fields on discovered pages. This adds significant value by providing actionable insights about application interactivity.

**Independent Test**: Crawl a site with known forms and buttons, verify the tool correctly identifies and reports these elements in the JSON output. The summary should include counts of forms, buttons, and input fields.

### Tests for User Story 2

- [X] T029 [P] [US2] Unit test for HTML parser in tests/unit/parsers/html-parser.test.ts (test form, button, input extraction)
- [X] T030 [P] [US2] Integration test for element extraction in tests/integration/elements.test.ts (test crawl with sample HTML fixtures)

### Implementation for User Story 2

- [X] T031 [P] [US2] Create Form model in src/models/form.ts (id, action, method, pageUrl, inputFields fields)
- [X] T032 [P] [US2] Create Button model in src/models/button.ts (type, text, id, className, pageUrl, formId fields)
- [X] T033 [P] [US2] Create InputField model in src/models/input-field.ts (type, name, id, required, placeholder, pageUrl, formId fields)
- [X] T034 [US2] Implement HTML parser in src/parsers/html-parser.ts (use Cheerio to extract forms, buttons, inputs from HTML)
- [X] T035 [US2] Integrate HTML parser into page processor in src/crawler/page-processor.ts (extract elements after page load)
- [X] T036 [US2] Update crawler to collect elements in src/crawler/crawler.ts (store forms, buttons, inputs in crawl results)
- [X] T037 [US2] Update CrawlSummary model to include element counts in src/models/crawl-summary.ts (totalForms, totalButtons, totalInputFields)
- [X] T038 [US2] Update JSON formatter to include elements in output in src/output/json-formatter.ts (add forms, buttons, inputFields arrays)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. The crawler should discover pages and identify interactive elements.

---

## Phase 5: User Story 3 - Respect Robots.txt and Rate Limiting (Priority: P3)

**Goal**: Implement responsible crawling behavior by respecting robots.txt rules and implementing rate limiting. This ensures ethical and sustainable crawling practices.

**Independent Test**: Crawl a site with a robots.txt file, verify the tool respects disallowed paths and implements delays between requests. Check that skipped paths are included in summary.

### Tests for User Story 3

- [X] T039 [P] [US3] Unit test for robots parser in tests/unit/parsers/robots-parser.test.ts (test robots.txt parsing, path checking)
- [X] T040 [P] [US3] Unit test for rate limiter in tests/unit/utils/rate-limiter.test.ts (test delay enforcement, 429 handling)
- [X] T041 [P] [US3] Integration test for robots.txt compliance in tests/integration/robots.test.ts (test crawl respects disallowed paths)

### Implementation for User Story 3

- [X] T042 [US3] Implement robots parser in src/parsers/robots-parser.ts (fetch robots.txt, parse with robots-parser library, check URL against rules)
- [X] T043 [US3] Integrate robots.txt checking into crawler in src/crawler/crawler.ts (check each URL before crawling, skip disallowed paths)
- [X] T044 [US3] Implement rate limiter in src/utils/rate-limiter.ts (configurable delay, await after each request)
- [X] T045 [US3] Integrate rate limiting into crawler in src/crawler/crawler.ts (apply delay after each page request)
- [X] T046 [US3] Add 429 response handling with exponential backoff in src/crawler/page-processor.ts (detect 429, back off, retry)
- [X] T047 [US3] Update CLI to accept rate-limit option in src/cli/crawl.ts (--rate-limit flag with default 1.5 seconds)
- [X] T048 [US3] Update CrawlSummary to track skipped pages in src/models/crawl-summary.ts (increment skipped count for robots.txt disallowed paths)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. The crawler should respect robots.txt and implement rate limiting.

---

## Phase 6: User Story 4 - Generate Discovery Summary (Priority: P4)

**Goal**: Enhance output to provide comprehensive summary of discovered elements. This completes the user workflow by presenting findings in a usable format (JSON and optional human-readable text).

**Independent Test**: Run a crawl and verify the tool outputs a well-formatted summary containing page counts, element counts, and key findings. Test both JSON and text output formats.

### Tests for User Story 4

- [X] T049 [P] [US4] Unit test for text formatter in tests/unit/output/text-formatter.test.ts (test human-readable summary formatting)
- [X] T050 [P] [US4] Integration test for summary output in tests/integration/output.test.ts (test JSON and text output formats)

### Implementation for User Story 4

- [X] T051 [US4] Implement text formatter in src/output/text-formatter.ts (format crawl summary as human-readable text)
- [X] T052 [US4] Update CLI to support output format option in src/cli/crawl.ts (--format flag: json|text, default json)
- [X] T053 [US4] Update CLI to support verbose mode in src/cli/crawl.ts (--verbose flag for detailed output)
- [X] T054 [US4] Update JSON formatter to include verbose details when requested in src/output/json-formatter.ts (include all page/element details in verbose mode)
- [X] T055 [US4] Update text formatter to show error and skipped page details in src/output/text-formatter.ts (include error summary, skipped paths)
- [X] T056 [US4] Update crawler to calculate duration on completion in src/crawler/crawler.ts (set endTime, calculate duration)
- [X] T057 [US4] Update CLI to support output file option in src/cli/crawl.ts (--output flag to save results to file)

**Checkpoint**: All user stories should now be independently functional. The crawler should output comprehensive summaries in both JSON and text formats.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T058 [P] Add comprehensive error messages with actionable guidance in src/utils/errors.ts (improve error messages per Article III)
- [X] T059 [P] Add CLI help text and examples in src/cli/crawl.ts (--help output per Article IX)
- [X] T060 [P] Update README.md with usage examples, command options, and quickstart guide
- [X] T061 [P] Add code comments explaining "why" not "what" throughout codebase (per Article IX)
- [X] T062 [P] Add unit tests for remaining utilities in tests/unit/utils/ (domain.ts, url-validator.ts, logger.ts)
- [X] T063 [P] Add unit tests for models in tests/unit/models/ (validate model creation, serialization)
- [X] T064 Run quickstart.md validation (test all examples from quickstart.md work correctly)
- [X] T065 Verify 80% test coverage requirement (run coverage report, add tests if needed)
- [X] T066 Code cleanup and refactoring (remove unused code, improve naming, optimize)
- [X] T067 Performance optimization (profile crawl performance, optimize bottlenecks)
- [X] T068 Security review (validate URL input, prevent SSRF, review dependencies)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3 → P4)
  - Or in parallel if team capacity allows (after foundational)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs page discovery to extract elements) - Can start after US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2 (can be parallel)
- **User Story 4 (P4)**: Depends on US1, US2 (needs pages and elements to summarize) - Can start after US1, US2

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services/parsers
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - US1 and US3 can start in parallel (US3 doesn't depend on US1)
  - US2 must wait for US1
  - US4 must wait for US1 and US2
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (respecting dependencies)

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create Page model in src/models/page.ts"
Task: "Create CrawlSummary model in src/models/crawl-summary.ts"

# Launch all tests for User Story 1 together:
Task: "Unit test for URL normalizer in tests/unit/utils/url-normalizer.test.ts"
Task: "Unit test for page processor in tests/unit/crawler/page-processor.test.ts"
Task: "Integration test for basic crawl flow in tests/integration/crawler.test.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all models for User Story 2 together:
Task: "Create Form model in src/models/form.ts"
Task: "Create Button model in src/models/button.ts"
Task: "Create InputField model in src/models/input-field.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

**MVP Deliverable**: Working crawler that discovers pages and outputs JSON results.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (with element extraction)
4. Add User Story 3 → Test independently → Deploy/Demo (with robots.txt + rate limiting)
5. Add User Story 4 → Test independently → Deploy/Demo (with summary output)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP)
   - Developer B: User Story 3 (can work in parallel, no dependency on US1)
3. After US1 completes:
   - Developer A: User Story 2 (depends on US1)
   - Developer B: Continue US3 or start US4 prep
4. After US1 and US2 complete:
   - Developer A: User Story 4 (depends on US1, US2)
   - Developer B: Polish & optimization

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Total tasks: 68
- MVP scope: Phases 1-3 (Setup + Foundational + User Story 1)

