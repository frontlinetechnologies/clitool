# Contract: Context Loader API

**Feature**: 007-ai-context-option
**Date**: 2025-12-19

## Module: `src/context/context-loader.ts`

### Function: `loadContext`

Loads and merges context from all available sources.

```typescript
/**
 * Load context from file, inline text, and environment variable.
 * Merges all sources with labeled headers.
 *
 * @param options - CLI options containing context paths/text
 * @returns Context loader result with merged content and warnings
 * @throws ContextError if file not found, not readable, invalid UTF-8, or exceeds size limit
 */
export function loadContext(options: ContextOptions): ContextLoaderResult;
```

**Input**:
```typescript
interface ContextOptions {
  context?: string;      // File path from --context flag
  contextText?: string;  // Inline text from --context-text flag
}
```

**Output**:
```typescript
interface ContextLoaderResult {
  context: MergedContext | null;  // null if no context from any source
  warnings: string[];             // Size warnings, etc.
}
```

**Behavior**:
1. Check for file context (`options.context`)
   - Validate file exists → throw `ContextError` if not
   - Check file size → throw if > 100KB
   - Read as UTF-8 → throw if invalid encoding
   - Create `ContextSource` with type 'file'

2. Check for inline context (`options.contextText`)
   - Create `ContextSource` with type 'inline'

3. Check for environment context (`process.env.TESTARION_CONTEXT`)
   - Create `ContextSource` with type 'environment'

4. If no sources found, return `{ context: null, warnings: [] }`

5. Merge sources in order: file → inline → environment
   - Add header before each source content
   - Calculate total size

6. Check total size:
   - If > 100KB → throw `ContextError`
   - If > 50KB → add warning to result

7. Return `ContextLoaderResult`

---

### Function: `loadContextFromFile`

Loads context from a single file with validation.

```typescript
/**
 * Load and validate a context file.
 *
 * @param filePath - Path to the context file
 * @returns ContextSource with file content
 * @throws ContextError if file not found, not readable, or invalid
 */
export function loadContextFromFile(filePath: string): ContextSource;
```

**Errors**:
| Condition | Error Code | Message |
|-----------|------------|---------|
| File not found | `FILE_NOT_FOUND` | `Context file not found: {path}` |
| Permission denied | `FILE_NOT_READABLE` | `Cannot read context file: {path}` |
| Invalid UTF-8 | `INVALID_ENCODING` | `Context file contains invalid characters: {path}` |
| Size > 100KB | `SIZE_EXCEEDED` | `Context file exceeds 100KB limit ({size}KB)` |

---

## Module: `src/context/context-merger.ts`

### Function: `mergeContextSources`

Combines multiple context sources with headers.

```typescript
/**
 * Merge multiple context sources into a single string with headers.
 *
 * @param sources - Array of context sources in priority order
 * @returns MergedContext with combined content
 */
export function mergeContextSources(sources: ContextSource[]): MergedContext;
```

**Input**:
```typescript
// Sources should be in order: file, inline, environment
const sources: ContextSource[] = [
  { type: 'file', content: '...', reference: './context.md', size: 1024 },
  { type: 'inline', content: '...', reference: 'inline', size: 50 },
];
```

**Output**:
```typescript
interface MergedContext {
  content: string;       // Full merged text with headers
  totalSize: number;     // Sum of all source sizes
  sources: ContextSource[];
  sizeWarning: boolean;  // true if totalSize > 50KB
}
```

**Output Format**:
```markdown
### From File:
[file content]

### Inline:
[inline content]

### From Environment:
[environment content]
```

---

## Module: `src/context/types.ts`

Exports all types and constants used by context modules.

```typescript
// Types
export type ContextSourceType = 'file' | 'inline' | 'environment';
export interface ContextSource { ... }
export interface ContextOptions { ... }
export interface MergedContext { ... }
export interface ContextLoaderResult { ... }

// Constants
export const CONTEXT_SIZE_WARNING_THRESHOLD: number;
export const CONTEXT_SIZE_MAX: number;
export const CONTEXT_ENV_VAR: string;
export const CONTEXT_HEADERS: Record<ContextSourceType, string>;
```

---

## Error Contract: `ContextError`

```typescript
export type ContextErrorCode =
  | 'FILE_NOT_FOUND'
  | 'FILE_NOT_READABLE'
  | 'INVALID_ENCODING'
  | 'SIZE_EXCEEDED';

export class ContextError extends Error {
  constructor(
    public readonly code: ContextErrorCode,
    message: string,
    public readonly filePath?: string,
    public readonly suggestion?: string
  );
}
```

**Error Examples**:

```typescript
// File not found
new ContextError(
  'FILE_NOT_FOUND',
  'Context file not found: ./missing.md',
  './missing.md',
  'Run with an existing .md or .txt file.'
)

// Size exceeded
new ContextError(
  'SIZE_EXCEEDED',
  'Context file exceeds 100KB limit (150KB).',
  './large.md',
  'Try summarizing or splitting the content.'
)
```

---

## Integration Contract: CLI Commands

Each CLI command (`crawl`, `generate-docs`, `generate-tests`) adds these options:

```typescript
.option('--context <path>', 'Path to a context file (.md or .txt) with additional guidance for AI')
.option('--context-text <text>', 'Inline context text to include in AI prompts')
```

**Option Handling**:
```typescript
// In command action handler
const { context: contextResult, warnings } = loadContext(options);

// Display warnings
warnings.forEach(w => console.warn(w));

// Pass to AI functions
if (contextResult) {
  aiOptions.userContext = contextResult.content;
}
```

---

## Integration Contract: Prompt System

Update `PromptContext` type in `src/prompts/types.ts`:

```typescript
export interface PromptContext {
  // ... existing fields
  userContext?: string;  // NEW: User-provided context from CLI
}
```

Update prompts to conditionally include context:

```markdown
{{#if userContext}}
### Additional Context:
{{userContext}}
{{/if}}
```
