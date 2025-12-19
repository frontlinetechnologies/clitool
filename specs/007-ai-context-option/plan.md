# Implementation Plan: AI Context Option

**Branch**: `007-ai-context-option` | **Date**: 2025-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-ai-context-option/spec.md`

## Summary

Add optional CLI flags (`--context`, `--context-text`) and environment variable (`TESTARION_CONTEXT`) support to allow users to provide additional context to AI prompts. Context from multiple sources is combined with labeled headers and passed to the AI prompt generation system. File-based context supports up to 100KB with a warning at 50KB.

## Technical Context

**Language/Version**: TypeScript 5.3 with strict mode (ES2022 target)
**Primary Dependencies**: commander 11.x (CLI), @anthropic-ai/sdk, Node.js fs/path (native)
**Storage**: File-based (context files read from local filesystem)
**Testing**: Vitest (existing test framework in project)
**Target Platform**: Node.js LTS (cross-platform: macOS, Linux, Windows)
**Project Type**: Single CLI application
**Performance Goals**: Context loading < 100ms for 100KB files
**Constraints**: Max context size 100KB, warn at 50KB, UTF-8 encoding required
**Scale/Scope**: Single-user CLI tool, context files up to 100KB

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Requirement | Status | Notes |
|---------|-------------|--------|-------|
| I: Simplicity First | CLI usable without docs | ✅ PASS | `--context` and `--context-text` follow intuitive patterns |
| II: Zero Configuration Start | Minimal setup required | ✅ PASS | Context is optional; existing commands work unchanged |
| III: Transparent Operations | Clear communication | ✅ PASS | Warning at 50KB, error at 100KB with actionable messages |
| IV: Playwright Compatibility | Valid Playwright output | ✅ PASS | No impact on generated test format |
| V: Modular Architecture | Independent modules | ✅ PASS | Context loading isolated in new module |
| VI: Dependency Minimalism | Justified dependencies | ✅ PASS | Uses only native Node.js fs/path |
| VII: Cross-Platform Consistency | Works on all OS | ✅ PASS | Path handling uses Node.js path module |
| VIII: Test Coverage | All code tested | ✅ PASS | Unit tests for context loading, integration tests for CLI |
| IX: Documentation as Code | README updated | ✅ PASS | Will document new options in CLI help and README |
| X: Community-Friendly | Clear contribution path | ✅ PASS | Standard module structure, typed interfaces |

**Gate Result**: PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/007-ai-context-option/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── context/             # NEW: Context loading module
│   ├── context-loader.ts    # Main context loading logic
│   ├── context-merger.ts    # Combines multiple sources
│   └── types.ts             # Context type definitions
├── cli/
│   ├── crawl.ts         # Add --context, --context-text options
│   ├── generate-docs.ts # Add --context, --context-text options
│   └── generate-tests.ts # Add --context, --context-text options
├── ai/
│   └── anthropic-client.ts  # Update to accept context parameter
└── prompts/
    └── prompt-loader.ts     # Update to inject context into prompts

tests/
├── unit/
│   └── context/
│       ├── context-loader.test.ts
│       └── context-merger.test.ts
└── integration/
    └── cli-context.test.ts
```

**Structure Decision**: Single project (Option 1). New `context/` module follows existing modular architecture pattern. Context functionality is isolated and testable independently.

## Complexity Tracking

> No violations - table not needed.
