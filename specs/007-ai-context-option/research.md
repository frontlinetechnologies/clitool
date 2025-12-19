# Research: AI Context Option

**Feature**: 007-ai-context-option
**Date**: 2025-12-19

## Research Topics

### 1. Commander.js Multi-Value Options

**Decision**: Use standard `.option()` for file path and inline text as separate options.

**Rationale**: Commander.js provides straightforward string options. The `--context` option takes a file path, `--context-text` takes inline text. Both are optional and can be combined. This matches existing patterns in the codebase (e.g., `crawl.ts` options).

**Alternatives Considered**:
- Variadic options (`.option('--context <paths...>')`) - Rejected: Overcomplicates for the common single-file case
- Repeatable options - Rejected: Not needed for initial implementation; can extend later if requested

### 2. File Size Detection and Validation

**Decision**: Use `fs.statSync()` for size check before reading, `fs.readFileSync()` with UTF-8 encoding for content.

**Rationale**:
- `statSync()` provides file size without reading content (efficient for large files that exceed limit)
- Size thresholds: warn at 50KB (51,200 bytes), error at 100KB (102,400 bytes)
- Synchronous operations are acceptable for CLI tool startup phase

**Alternatives Considered**:
- Async file operations - Rejected: CLI startup is inherently synchronous, adds complexity without benefit
- Stream-based reading - Rejected: Overkill for 100KB max; would complicate UTF-8 validation

### 3. UTF-8 Validation

**Decision**: Use Node.js `Buffer.toString('utf8')` with explicit encoding check.

**Rationale**: Node.js `readFileSync` with `'utf8'` encoding will throw on invalid sequences in strict mode. For additional validation, check for replacement characters (U+FFFD) in result.

**Alternatives Considered**:
- Third-party encoding detection libraries - Rejected: Violates dependency minimalism (Constitution Article VI)
- Binary detection via magic bytes - Rejected: Overengineered; UTF-8 validation sufficient

### 4. Context Merging Strategy

**Decision**: Concatenate with markdown headers as separators, in order: file → inline → environment.

**Rationale**: Per clarification session, each source gets a header label (e.g., `### From File:`) for traceability. Order follows precedence: most specific (file) first, most general (environment) last.

**Format**:
```markdown
### From File:
[file content]

### Inline:
[inline text]

### From Environment:
[env var content]
```

**Alternatives Considered**:
- Simple newline concatenation - Rejected: Loses source traceability per clarification
- JSON structure - Rejected: Markdown headers integrate better with AI prompts

### 5. Integration with Existing Prompt System

**Decision**: Pass merged context as a new variable to `loadAndRenderPrompt()`.

**Rationale**: The existing prompt loader supports context variables via the `PromptContext` type. Add a new `userContext` variable that prompts can optionally include via `{{#if userContext}}` conditional blocks.

**Implementation**:
1. Add `userContext?: string` to `PromptContext` type
2. Update existing prompts with conditional inclusion: `{{#if userContext}}### Additional Context:\n{{userContext}}{{/if}}`
3. AI client functions accept optional `context` parameter and pass to prompt rendering

**Alternatives Considered**:
- Modify prompts at runtime (string manipulation) - Rejected: Breaks separation of concerns in prompt system
- Separate context injection layer - Rejected: Unnecessary complexity; prompt system already supports conditionals

### 6. Error Message Design

**Decision**: Follow existing error patterns with actionable suggestions.

**Error Types**:
| Scenario | Message | Exit Code |
|----------|---------|-----------|
| File not found | `Error: Context file not found: {path}\nRun with an existing .md or .txt file.` | 1 |
| File not readable | `Error: Cannot read context file: {path}\nCheck file permissions.` | 1 |
| Invalid UTF-8 | `Error: Context file contains invalid characters: {path}\nEnsure the file is saved as UTF-8.` | 1 |
| Size warning (50KB+) | `Warning: Context file is large ({size}KB). This may affect AI response time.` | 0 (continue) |
| Size exceeded (100KB+) | `Error: Context file exceeds 100KB limit ({size}KB).\nTry summarizing or splitting the content.` | 1 |

**Rationale**: Matches existing error handling patterns in `config-loader.ts` and `prompt-loader.ts`. Suggestions help users resolve issues.

### 7. Environment Variable Naming

**Decision**: Use `TESTARION_CONTEXT` as the environment variable name.

**Rationale**: Follows project naming convention (package is `testarion`). Clear, unambiguous, matches existing `ANTHROPIC_API_KEY` pattern.

**Alternatives Considered**:
- `TESTARION_AI_CONTEXT` - Rejected: Unnecessarily verbose
- `E2E_CONTEXT` - Rejected: Too generic, potential conflicts

## Summary

All research items resolved. No external dependencies required. Implementation follows existing codebase patterns for CLI options, file handling, and prompt rendering.
