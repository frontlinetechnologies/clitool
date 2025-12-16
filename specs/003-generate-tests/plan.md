# Implementation Plan: Generate End-to-End Tests

**Branch**: `003-generate-tests` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-generate-tests/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a CLI command that generates valid Playwright end-to-end test scripts from crawl results. The command accepts crawl results via stdin/stdout piping, uses AI to analyze crawl data and generate contextually appropriate test scripts, detects user flows (navigation, login, checkout, form submission), identifies specific scenarios (e.g., coupon codes), and outputs organized test files (one file per user flow) to a configurable directory with default location `./tests/generated/`.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode (Node.js LTS)  
**Primary Dependencies**: @anthropic-ai/sdk (Anthropic API client), @playwright/test (Playwright test framework), commander (CLI), existing crawl models and documentation modules  
**Storage**: In-memory during processing, output to filesystem (no persistent storage required)  
**Testing**: Jest with existing test utilities, minimum 80% coverage  
**Target Platform**: macOS, Linux, Windows (cross-platform CLI)  
**Project Type**: Single CLI application (extends existing crawl tool)  
**Performance Goals**: Generate tests within 10 minutes for crawl results with up to 1000 pages  
**Constraints**: Must handle AI API unavailability gracefully, work with stdin/stdout piping, respect memory limits for large crawl results, generate valid Playwright scripts that can be executed without modification in 90% of cases  
**Scale/Scope**: Typical crawl results (10-1000 pages), efficient processing without running out of memory, organized test file output (one file per user flow)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with all constitution articles:

- **Article I - Simplicity First**: ✅ Single command `generate-tests` with intuitive piping pattern (`crawl url | generate-tests`), sensible defaults (default output directory), optional directory override
- **Article II - Zero Configuration Start**: ✅ Works with just piped crawl results, optional `--output-dir` flag, API key via environment variable (standard practice), default output directory created automatically
- **Article III - Transparent Operations**: ✅ Clear error messages for empty results, AI API failures, file write errors; warning message when overwriting files; progress indicators for test generation
- **Article IV - Playwright Compatibility**: ✅ Generated tests are valid, runnable Playwright scripts following best practices, self-contained and independently runnable, users can extend with standard Playwright APIs
- **Article V - Modular Architecture**: ✅ Separate modules for test generation, AI integration, flow detection, test code generation; decoupled from crawl logic; reusable test generation components
- **Article VI - Dependency Minimalism**: ✅ Uses existing @anthropic-ai/sdk and @playwright/test (already in dependencies), reuses existing dependencies (commander, models), no unnecessary utilities
- **Article VII - Cross-Platform Consistency**: ✅ Node.js/TypeScript ensures cross-platform, stdin/stdout work identically across platforms, file paths handled via path module, directory creation works on all platforms
- **Article VIII - Test Coverage**: ✅ Unit tests for test generators, flow detectors, test code formatters; integration tests for full pipeline; minimum 80% coverage
- **Article IX - Documentation as Code**: ✅ CLI help text, quickstart guide, examples in README, code comments explain "why"
- **Article X - Community-Friendly Development**: ✅ TypeScript strict mode, ESLint, clear module structure, follows existing code patterns

**Status**: ✅ All articles compliant. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-generate-tests/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── cli/
│   ├── crawl.ts         # Existing crawl command
│   ├── generate-docs.ts # Existing generate-docs command
│   └── generate-tests.ts # New CLI command entry point
├── test-generation/
│   ├── test-generator.ts      # Main test generation orchestration
│   ├── playwright-codegen.ts  # Playwright test code generation
│   ├── test-data-generator.ts # Test data generation (input values, strings)
│   └── test-file-organizer.ts # Test file organization (one file per flow)
├── documentation/       # Existing documentation modules (reuse flow-detector, structure-analyzer)
│   ├── flow-detector.ts # Reuse for detecting user flows
│   └── structure-analyzer.ts # Reuse for navigation analysis
├── ai/
│   └── anthropic-client.ts # Existing Anthropic API client (reuse)
├── models/               # Existing models (Page, Form, Button, InputField, CrawlSummary)
├── output/               # Existing formatters (json-formatter, text-formatter)
└── utils/                # Existing utilities
```

**Structure Decision**: Single project structure - extends existing CLI tool with new command and test-generation module. Test generation logic separated into `test-generation/` module, reuses existing `documentation/` modules for flow detection and structure analysis, AI integration reuses existing `ai/` module, follows existing modular patterns from crawl and generate-docs features.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution articles are compliant.
