# Implementation Plan: Provide Own AI API Key

**Branch**: `004-user-api-key` | **Date**: 2025-01-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-user-api-key/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Allow users to configure their own Anthropic API key through multiple methods (environment variable, CLI parameter, configuration file) with proper validation, error handling, and security. The feature extends existing CLI parameter and environment variable support by adding configuration file support, format validation, improved error messages, and auto-creation prompts. Technical approach uses Node.js fs module for config file operations, JSON parsing for config structure, and format validation before API calls.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.3.2 (strict mode)  
**Primary Dependencies**: Node.js fs/path modules (native), commander.js (CLI parsing), @anthropic-ai/sdk (AI client)  
**Storage**: JSON files (`.testarion/config.json` for project-level, `~/.testarion/config.json` for global)  
**Testing**: Jest 29.7.0 with ts-jest  
**Target Platform**: Node.js >=18.0.0 (macOS, Linux, Windows)  
**Project Type**: Single CLI tool (npm package)  
**Performance Goals**: Config file read/write operations complete in <10ms, no impact on command startup time  
**Constraints**: Must maintain backward compatibility with existing CLI/env var methods, file permissions 600 for security  
**Scale/Scope**: Single user per machine, config files per project or global, no concurrent access concerns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Article I: Simplicity First ✅
- Config file support is optional; existing CLI/env var methods remain functional
- Auto-creation prompt is non-intrusive (once per session)
- Default behavior unchanged for users without config files

### Article II: Zero Configuration Start ✅
- Config files are optional, never required
- Users can still use CLI/env var methods without config files
- Auto-creation is prompted, not forced

### Article III: Transparent Operations ✅
- Clear error messages for invalid keys and config file issues
- Verbose mode provides configuration guidance
- File operations (create/read) are explicit

### Article IV: Playwright Compatibility ✅
- No impact on Playwright compatibility (API key is for AI features only)

### Article V: Modular Architecture ✅
- Config file handling isolated in new utility module
- Existing API client remains unchanged
- Clear separation of concerns

### Article VI: Dependency Minimalism ✅
- Uses native Node.js fs/path modules only
- No new external dependencies required
- JSON parsing uses native JSON.parse

### Article VII: Cross-Platform Consistency ✅
- File path handling uses path.join() for platform-agnostic paths
- File permissions (600) work consistently across platforms
- Home directory resolution uses os.homedir()

### Article VIII: Test Coverage ✅
- Unit tests for config file read/write operations
- Unit tests for key resolution priority logic
- Unit tests for format validation
- Integration tests for end-to-end config file scenarios

### Article IX: Documentation as Code ✅
- CLI help text updated to mention config file option
- Error messages guide users to configuration methods
- README updated with config file examples

### Article X: Community-Friendly Development ✅
- No impact on contribution workflow
- Standard file operations, no complex patterns

**Gate Status**: ✅ PASS - All constitution articles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/004-user-api-key/
├── plan.md                    # This file (/speckit.plan command output)
├── spec.md                    # Feature specification (/speckit.specify command)
├── research.md                # Phase 0 output (/speckit.plan command) ✅
├── data-model.md              # Phase 1 output (/speckit.plan command) ✅
├── quickstart.md              # Phase 1 output (/speckit.plan command) ✅
├── contracts/                 # Phase 1 output (/speckit.plan command) ✅
│   └── config-loader-api.md   # API contract for config loader module
└── tasks.md                    # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── utils/
│   └── config-loader.ts          # NEW: Config file loading and key resolution
├── cli/
│   ├── crawl.ts                  # Existing
│   ├── generate-docs.ts          # Existing (needs config integration)
│   └── generate-tests.ts         # Existing (needs config integration)
└── ai/
    └── anthropic-client.ts       # Existing (needs validation enhancement)

tests/
├── unit/
│   └── utils/
│       └── config-loader.test.ts  # NEW: Unit tests for config loader
└── integration/
    └── config-file.test.ts        # NEW: Integration tests for config file scenarios
```

**Structure Decision**: Single project structure. New `config-loader.ts` utility module in `src/utils/` handles all config file operations (read, write, key resolution). CLI commands (`generate-docs.ts`, `generate-tests.ts`) integrate config loader into existing key resolution flow. No changes to existing module structure; additive only.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution articles satisfied.

---

## Phase 0: Research ✅ Complete

**Output**: `research.md`

**Decisions Made**:
1. Use native Node.js fs module for config file operations
2. JSON format for configuration files
3. Project-level and global config file locations
4. API key format validation (prefix check)
5. File permissions 600 for security
6. Prompt-based auto-creation
7. Key resolution priority order
8. Error message strategy

**All NEEDS CLARIFICATION items resolved.**

---

## Phase 1: Design & Contracts ✅ Complete

**Outputs**:
- `data-model.md` - Entity definitions, relationships, data flow
- `contracts/config-loader-api.md` - Public API contract for config loader module
- `quickstart.md` - User-facing quick start guide

**Design Artifacts**:
- Config file structure and validation rules
- Key resolution algorithm
- File operations (read/write) with error handling
- Prompt state management

**Agent Context**: ✅ Updated (Cursor IDE context file)

---

## Next Steps

1. **Phase 2**: Run `/speckit.tasks` to generate task breakdown
2. **Implementation**: Follow tasks.md for implementation order
3. **Testing**: Unit tests for config-loader, integration tests for CLI commands
4. **Documentation**: Update README with config file examples

**Ready for**: `/speckit.tasks` command
