# Implementation Plan: Crawl a Web Application

**Branch**: `001-web-crawl` | **Date**: 2024-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-web-crawl/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a CLI tool that crawls web applications to discover pages, forms, buttons, and input fields. The tool accepts a URL, respects robots.txt, implements rate limiting, provides real-time progress updates, and outputs results in JSON format with optional human-readable text. Uses Playwright for browser automation to handle JavaScript-rendered content and extract interactive elements accurately.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode (Node.js LTS)  
**Primary Dependencies**: Playwright, cheerio (HTML parsing), commander (CLI), robots-parser (robots.txt parsing)  
**Storage**: In-memory during crawl, output to stdout/files (no persistent storage required)  
**Testing**: Jest with Playwright test utilities, minimum 80% coverage  
**Target Platform**: macOS, Linux, Windows (cross-platform CLI)  
**Project Type**: Single CLI application  
**Performance Goals**: Complete crawl of 1000 pages within 30 minutes (target: ~33 pages/minute, ~2 seconds/page with rate limiting)  
**Constraints**: Must respect robots.txt, implement rate limiting (default 1-2s delay), handle interruptions gracefully, output within 5 seconds of completion  
**Scale/Scope**: Typical SaaS apps (10-1000 pages), up to 30-minute crawl duration, memory-efficient for large sites

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with all constitution articles:

- **Article I - Simplicity First**: ✅ Single command with URL argument, intuitive `crawl <url>` pattern, sensible defaults
- **Article II - Zero Configuration Start**: ✅ Works with just URL argument, optional flags for advanced use, no config file required
- **Article III - Transparent Operations**: ✅ Real-time progress updates, clear error messages, verbose mode, interruption handling
- **Article IV - Playwright Compatibility**: ✅ Uses Playwright for browser automation (foundation for future test generation)
- **Article V - Modular Architecture**: ✅ Separate modules for crawling, parsing, robots.txt, output formatting, CLI interface
- **Article VI - Dependency Minimalism**: ✅ Core: Playwright, cheerio, commander, robots-parser (all justified and minimal)
- **Article VII - Cross-Platform Consistency**: ✅ Node.js/TypeScript ensures cross-platform, file paths handled via path module
- **Article VIII - Test Coverage**: ✅ Unit tests for parsers/utils, integration tests for crawl flows, minimum 80% coverage
- **Article IX - Documentation as Code**: ✅ CLI help text, README examples, code comments explain "why"
- **Article X - Community-Friendly Development**: ✅ TypeScript strict mode, ESLint, clear module structure

**Status**: ✅ All articles compliant. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-web-crawl/
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
│   └── crawl.ts         # CLI command entry point
├── crawler/
│   ├── crawler.ts       # Main crawl orchestration
│   ├── page-processor.ts # Page discovery and processing
│   └── url-normalizer.ts # URL normalization and deduplication
├── parsers/
│   ├── html-parser.ts   # Extract forms, buttons, inputs from HTML
│   └── robots-parser.ts # Parse and respect robots.txt
├── output/
│   ├── json-formatter.ts # JSON output formatting
│   └── text-formatter.ts # Human-readable text formatting
├── models/
│   ├── page.ts          # Page entity
│   ├── form.ts          # Form entity
│   ├── button.ts        # Button entity
│   ├── input-field.ts   # Input field entity
│   └── crawl-summary.ts # Summary aggregation
└── utils/
    ├── rate-limiter.ts  # Rate limiting logic
    └── progress.ts       # Progress reporting

tests/
├── unit/
│   ├── parsers/
│   ├── utils/
│   └── models/
├── integration/
│   └── crawler.test.ts  # End-to-end crawl tests
└── fixtures/
    └── sample-pages/    # Test HTML fixtures
```

**Structure Decision**: Single project structure (Option 1) - CLI tool with modular organization. Crawler logic separated from parsing, output formatting, and CLI interface. Models define data structures. Utils provide shared functionality like rate limiting and progress reporting.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution articles are compliant.
