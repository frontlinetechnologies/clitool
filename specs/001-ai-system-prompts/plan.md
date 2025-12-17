# Implementation Plan: AI System Prompts

**Branch**: `001-ai-system-prompts` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-system-prompts/spec.md`

## Summary

Implement a centralized, user-editable system prompt management system for AI API calls. Prompts will be stored as Markdown files in a `prompts/` directory at project root with default backups in `prompts/defaults/`. The system will support variable substitution (`{{variable}}`), validation, fallback to defaults, and a CLI reset command.

## Technical Context

**Language/Version**: TypeScript 5.3 with strict mode (ES2022 target)
**Primary Dependencies**: @anthropic-ai/sdk, commander, Node.js fs/path (native)
**Storage**: File system - Markdown files in `prompts/` directory
**Testing**: Jest 29.7 with ts-jest
**Target Platform**: Node.js LTS (18+), cross-platform (macOS, Linux, Windows)
**Project Type**: Single project (CLI tool)
**Performance Goals**: Prompt loading <100ms, no impact on CLI startup for non-AI operations
**Constraints**: UTF-8 encoding, graceful fallback when prompts missing/corrupted
**Scale/Scope**: 3-5 initial prompt files, expandable as AI features grow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Requirement | Status | Notes |
|---------|-------------|--------|-------|
| I. Simplicity First | Prompts discoverable without docs | ✅ PASS | Clear directory structure, self-documenting files |
| II. Zero Configuration | No config required to use prompts | ✅ PASS | Defaults auto-loaded; customization optional |
| III. Transparent Operations | Clear feedback on prompt loading | ✅ PASS | Verbose mode logs prompt source; fallback warnings |
| IV. Playwright Compatibility | N/A - not test generation | ✅ N/A | Prompts support test generation but don't modify Playwright output |
| V. Modular Architecture | Prompt loading isolated from AI calls | ✅ PASS | New `src/prompts/` module, AI client calls prompt loader |
| VI. Dependency Minimalism | No new dependencies | ✅ PASS | Uses native fs/path, simple template literals |
| VII. Cross-Platform | File paths work on all OS | ✅ PASS | Use path.join, normalize paths |
| VIII. Test Coverage | Unit + integration tests | ✅ PASS | Test loader, validator, fallback, variable substitution |
| IX. Documentation as Code | README, help text, inline comments | ✅ PASS | Each prompt file self-documents; CLI help updated |
| X. Community-Friendly | Easy to contribute/customize | ✅ PASS | Simple Markdown format, clear conventions |

**Technology Boundaries Compliance**:
- ✅ Node.js LTS, TypeScript strict mode
- ✅ Uses native file operations (async)
- ✅ No new dependencies required
- ✅ No console.log in production (uses logger)

**Gate Result**: PASS - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-system-prompts/
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Implementation guide
├── contracts/           # Phase 1: API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── prompts/                    # NEW: Prompt management module
│   ├── prompt-loader.ts        # Load prompts from filesystem
│   ├── prompt-validator.ts     # Validate prompt structure & placeholders
│   ├── template-engine.ts      # Variable substitution
│   └── index.ts                # Public API exports
├── ai/
│   └── anthropic-client.ts     # MODIFIED: Use prompt loader
├── cli/
│   └── reset-prompts.ts        # NEW: CLI command for prompt reset
├── models/
├── utils/
├── crawler/
├── documentation/
└── test-generation/

prompts/                         # NEW: User-editable prompts at project root
├── defaults/                   # Default/reference prompts (read-only source)
│   ├── page-analysis.md
│   ├── test-scenario-generation.md
│   ├── test-data-generation.md
│   └── documentation-generation.md
├── page-analysis.md            # User copy (auto-created from defaults)
├── test-scenario-generation.md
├── test-data-generation.md
└── documentation-generation.md

tests/
├── unit/
│   └── prompts/                # NEW: Unit tests for prompt module
│       ├── prompt-loader.test.ts
│       ├── prompt-validator.test.ts
│       └── template-engine.test.ts
└── integration/
    └── prompts/                # NEW: Integration tests
        └── prompt-integration.test.ts
```

**Structure Decision**: Single project structure maintained. New `src/prompts/` module added following existing modular pattern (similar to `src/documentation/`, `src/test-generation/`). Prompts directory at project root for user accessibility.

## Complexity Tracking

> No violations - table intentionally empty

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |
