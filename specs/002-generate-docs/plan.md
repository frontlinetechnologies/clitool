# Implementation Plan: Generate Site Documentation

**Branch**: `002-generate-docs` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-generate-docs/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a CLI command that generates human-readable Markdown documentation from crawl results. The command accepts crawl results via stdin/stdout piping, uses Anthropic AI API to analyze pages and generate descriptions, identifies critical user flows (login, checkout, forms), documents site structure and navigation paths, and outputs well-formatted Markdown documentation to stdout or a configurable file location.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode (Node.js LTS)  
**Primary Dependencies**: @anthropic-ai/sdk (Anthropic API client), commander (CLI), existing crawl models and formatters  
**Storage**: In-memory during processing, output to stdout/files (no persistent storage required)  
**Testing**: Jest with existing test utilities, minimum 80% coverage  
**Target Platform**: macOS, Linux, Windows (cross-platform CLI)  
**Project Type**: Single CLI application (extends existing crawl tool)  
**Performance Goals**: Generate documentation within 5 minutes for crawl results with up to 1000 pages  
**Constraints**: Must handle AI API unavailability gracefully, work with stdin/stdout piping, respect memory limits for large crawl results  
**Scale/Scope**: Typical crawl results (10-1000 pages), efficient processing without running out of memory

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with all constitution articles:

- **Article I - Simplicity First**: ✅ Single command `generate-docs` with intuitive piping pattern (`crawl url | generate-docs`), sensible defaults (stdout output), optional file output
- **Article II - Zero Configuration Start**: ✅ Works with just piped crawl results, optional `--output` flag, API key via environment variable (standard practice)
- **Article III - Transparent Operations**: ✅ Clear error messages for empty results, AI API failures, file write errors; warning message when overwriting files
- **Article IV - Playwright Compatibility**: ✅ N/A (documentation generation, not test generation; foundation for future test generation features)
- **Article V - Modular Architecture**: ✅ Separate modules for documentation generation, AI integration, flow detection, markdown formatting; decoupled from crawl logic
- **Article VI - Dependency Minimalism**: ✅ Adds only @anthropic-ai/sdk (justified for AI analysis), reuses existing dependencies (commander, models)
- **Article VII - Cross-Platform Consistency**: ✅ Node.js/TypeScript ensures cross-platform, stdin/stdout work identically across platforms, file paths handled via path module
- **Article VIII - Test Coverage**: ✅ Unit tests for documentation generators, flow detectors, markdown formatters; integration tests for full pipeline; minimum 80% coverage
- **Article IX - Documentation as Code**: ✅ CLI help text, quickstart guide, examples in README, code comments explain "why"
- **Article X - Community-Friendly Development**: ✅ TypeScript strict mode, ESLint, clear module structure, follows existing code patterns

**Status**: ✅ All articles compliant. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-generate-docs/
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
│   └── generate-docs.ts # New CLI command entry point
├── documentation/
│   ├── doc-generator.ts  # Main documentation generation orchestration
│   ├── flow-detector.ts  # Critical user flow detection (login, checkout, forms)
│   ├── structure-analyzer.ts # Site structure and navigation analysis
│   └── markdown-formatter.ts # Markdown output formatting
├── ai/
│   └── anthropic-client.ts # Anthropic API client wrapper
├── models/               # Existing models (Page, Form, Button, InputField, CrawlSummary)
├── output/               # Existing formatters (json-formatter, text-formatter)
└── utils/                # Existing utilities
```

**Structure Decision**: Single project structure - extends existing CLI tool with new command and modules. Documentation generation logic separated into `documentation/` module, AI integration isolated in `ai/` module, follows existing modular patterns from crawl feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution articles are compliant.
