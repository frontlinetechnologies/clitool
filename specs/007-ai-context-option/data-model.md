# Data Model: AI Context Option

**Feature**: 007-ai-context-option
**Date**: 2025-12-19

## Entities

### ContextSource

Represents the origin of user-provided context.

```typescript
/**
 * Enumeration of context source types
 */
export type ContextSourceType = 'file' | 'inline' | 'environment';

/**
 * Represents a single source of context with its content
 */
export interface ContextSource {
  /** The type of context source */
  type: ContextSourceType;

  /** The raw content from this source */
  content: string;

  /** Original reference (file path, env var name, or 'inline') */
  reference: string;

  /** Size in bytes */
  size: number;
}
```

### ContextOptions

CLI options related to context, passed from Commander.js.

```typescript
/**
 * Context-related CLI options
 */
export interface ContextOptions {
  /** Path to context file (--context flag) */
  context?: string;

  /** Inline context text (--context-text flag) */
  contextText?: string;
}
```

### MergedContext

The result of combining all context sources.

```typescript
/**
 * Result of merging multiple context sources
 */
export interface MergedContext {
  /** Combined context content with headers */
  content: string;

  /** Total size in bytes */
  totalSize: number;

  /** Individual sources that were merged */
  sources: ContextSource[];

  /** Whether a size warning should be displayed */
  sizeWarning: boolean;
}
```

### ContextLoaderResult

Return type for the context loading operation.

```typescript
/**
 * Result of loading context from all sources
 */
export interface ContextLoaderResult {
  /** The merged context, or null if no context provided */
  context: MergedContext | null;

  /** Warning messages to display (e.g., size warnings) */
  warnings: string[];
}
```

## Constants

```typescript
/** Size threshold for warning (50KB) */
export const CONTEXT_SIZE_WARNING_THRESHOLD = 50 * 1024; // 51,200 bytes

/** Maximum allowed context size (100KB) */
export const CONTEXT_SIZE_MAX = 100 * 1024; // 102,400 bytes

/** Environment variable name for context */
export const CONTEXT_ENV_VAR = 'TESTARION_CONTEXT';

/** Header templates for merged context */
export const CONTEXT_HEADERS = {
  file: '### From File:',
  inline: '### Inline:',
  environment: '### From Environment:',
} as const;
```

## State Transitions

Context loading is stateless - each CLI invocation loads context fresh. No persistence between runs.

```text
[No Context] → loadContext(options) → [ContextLoaderResult]
                                            ↓
                                   context: null (if no sources)
                                   context: MergedContext (if sources exist)
```

## Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| `context` (file path) | File must exist | `Context file not found: {path}` |
| `context` (file path) | File must be readable | `Cannot read context file: {path}` |
| `context` (file path) | Content must be valid UTF-8 | `Context file contains invalid characters: {path}` |
| Total size | Must not exceed 100KB | `Context file exceeds 100KB limit ({size}KB)` |
| Total size | Warn if exceeds 50KB | Warning displayed, processing continues |

## Relationships

```text
┌─────────────────┐     ┌─────────────────┐
│  ContextOptions │────▶│  ContextLoader  │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ContextLoaderResult│
                        └────────┬────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  ContextSource  │     │  ContextSource  │     │  ContextSource  │
│  (type: file)   │     │ (type: inline)  │     │(type: environment)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                        ┌─────────────────┐
                        │  MergedContext  │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  PromptContext  │
                        │ (userContext)   │
                        └─────────────────┘
```
