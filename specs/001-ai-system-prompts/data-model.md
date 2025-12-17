# Data Model: AI System Prompts

**Feature**: 001-ai-system-prompts
**Date**: 2025-12-17

## Overview

This document defines the data entities, their attributes, relationships, and validation rules for the AI System Prompts feature.

---

## Entities

### 1. SystemPrompt

Represents a single AI system prompt stored as a Markdown file with YAML frontmatter.

```typescript
interface SystemPrompt {
  /** Unique identifier derived from filename (e.g., 'page-analysis') */
  name: string;

  /** Semantic version for tracking prompt evolution */
  version: string;

  /** Human-readable description of the prompt's purpose */
  description: string;

  /** Maximum tokens for AI response (passed to API) */
  maxTokens: number;

  /** Variables that can be substituted in the prompt */
  variables: PromptVariable[];

  /** The raw prompt template content (Markdown body after frontmatter) */
  templateContent: string;

  /** Source location of the prompt file */
  source: PromptSource;

  /** Timestamp of when the prompt was loaded */
  loadedAt: Date;
}
```

**Validation Rules**:
- `name`: Required, must match filename (without `.md`), alphanumeric with hyphens
- `version`: Required, must follow semver format (`X.Y.Z`)
- `description`: Required, non-empty string
- `maxTokens`: Required, positive integer, max 4096
- `variables`: Array (can be empty)
- `templateContent`: Required, non-empty string

---

### 2. PromptVariable

Describes a variable that can be substituted in a prompt template.

```typescript
interface PromptVariable {
  /** Variable name (used in {{name}} syntax) */
  name: string;

  /** Whether this variable must be provided at render time */
  required: boolean;

  /** Human-readable description of the variable's purpose */
  description: string;

  /** Default value if not provided (only for optional variables) */
  defaultValue?: string;
}
```

**Validation Rules**:
- `name`: Required, alphanumeric with underscores, no spaces
- `required`: Required, boolean
- `description`: Required, non-empty string
- `defaultValue`: Optional, only valid when `required` is false

---

### 3. PromptSource

Indicates where a prompt was loaded from.

```typescript
interface PromptSource {
  /** Type of source */
  type: 'user' | 'default';

  /** Absolute file path */
  filePath: string;

  /** Whether this is a fallback (user prompt missing/invalid) */
  isFallback: boolean;
}
```

---

### 4. PromptContext

Runtime data passed to the template engine for variable substitution.

```typescript
interface PromptContext {
  /** Key-value pairs for variable substitution */
  variables: Record<string, string | undefined>;

  /** Whether verbose logging is enabled */
  verbose: boolean;
}
```

---

### 5. PromptRenderResult

Output of rendering a prompt template with context.

```typescript
interface PromptRenderResult {
  /** The fully rendered prompt ready for API call */
  renderedContent: string;

  /** Source information for logging/debugging */
  source: PromptSource;

  /** Variables that were substituted */
  substitutedVariables: string[];

  /** Variables that were missing (for optional ones) */
  missingOptionalVariables: string[];

  /** Max tokens from prompt configuration */
  maxTokens: number;
}
```

---

### 6. PromptValidationError

Structured error for prompt validation failures.

```typescript
interface PromptValidationError {
  /** Error type for categorization */
  type: PromptErrorType;

  /** Human-readable error message */
  message: string;

  /** File path where error occurred */
  filePath: string;

  /** Specific field or line that caused the error (if applicable) */
  field?: string;

  /** Suggestions for fixing the error */
  suggestions: string[];
}

enum PromptErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PARSE_ERROR = 'PARSE_ERROR',
  INVALID_FRONTMATTER = 'INVALID_FRONTMATTER',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_VARIABLE = 'INVALID_VARIABLE',
  ENCODING_ERROR = 'ENCODING_ERROR',
  TEMPLATE_SYNTAX_ERROR = 'TEMPLATE_SYNTAX_ERROR',
  MISSING_REQUIRED_VARIABLE = 'MISSING_REQUIRED_VARIABLE',
}
```

---

### 7. PromptRegistry

In-memory cache of loaded prompts for performance.

```typescript
interface PromptRegistry {
  /** Map of prompt name to loaded SystemPrompt */
  prompts: Map<string, SystemPrompt>;

  /** Base directory for user prompts */
  userPromptsDir: string;

  /** Base directory for default prompts */
  defaultPromptsDir: string;

  /** Whether the registry has been initialized */
  initialized: boolean;
}
```

---

## Relationships

```
┌─────────────────┐       ┌──────────────────┐
│  PromptRegistry │1────*│   SystemPrompt   │
└─────────────────┘       └──────────────────┘
                                   │
                                   │1
                                   │
                                   ▼*
                          ┌──────────────────┐
                          │  PromptVariable  │
                          └──────────────────┘

┌─────────────────┐       ┌──────────────────┐
│  PromptContext  │──────▶│ PromptRenderResult│
└─────────────────┘       └──────────────────┘
        │                          │
        │                          │
        ▼                          ▼
  (runtime input)           (rendered output)

┌─────────────────┐
│  PromptSource   │──────▶ Indicates origin
└─────────────────┘
```

---

## State Transitions

### Prompt Loading State Machine

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           │
                           ▼
                ┌──────────────────┐
                │  Check User Path │
                └────────┬─────────┘
                         │
            ┌────────────┴────────────┐
            │ exists?                  │
            ▼                          ▼
    ┌───────────────┐         ┌───────────────┐
    │  Parse User   │         │ Check Default │
    │    Prompt     │         │     Path      │
    └───────┬───────┘         └───────┬───────┘
            │                         │
      ┌─────┴─────┐           ┌───────┴───────┐
      │ valid?    │           │ exists?       │
      ▼           ▼           ▼               ▼
┌──────────┐ ┌──────────┐ ┌──────────┐  ┌──────────┐
│  LOADED  │ │ Fallback │ │  Parse   │  │  ERROR   │
│  (user)  │ │ to       │ │ Default  │  │  (both   │
└──────────┘ │ default  │ └────┬─────┘  │ missing) │
             └────┬─────┘      │        └──────────┘
                  │            │
                  ▼            ▼
            ┌──────────┐  ┌──────────┐
            │  LOADED  │  │  LOADED  │
            │ (default)│  │ (default)│
            │ +warning │  └──────────┘
            └──────────┘
```

---

## File Format Specification

### Prompt File Structure

```markdown
---
name: <prompt-identifier>
version: <semver>
description: <human-readable-description>
max_tokens: <integer>
variables:
  - name: <variable-name>
    required: <boolean>
    description: <variable-description>
    default: <optional-default-value>
---

<prompt-template-content>
```

### Example: page-analysis.md

```markdown
---
name: page-analysis
version: 1.0.0
description: Analyzes web pages to generate human-readable descriptions
max_tokens: 500
variables:
  - name: url
    required: true
    description: The URL of the page being analyzed
  - name: title
    required: false
    description: The page title if available
  - name: content
    required: false
    description: Page content preview (truncated to 2000 chars)
---

Analyze this web page and provide a brief, human-readable description (2-3 sentences) of what this page is about and its primary purpose.

URL: {{url}}
{{#if title}}Title: {{title}}{{/if}}

{{#if content}}
Content preview:
{{content}}
{{/if}}

Provide a concise description focusing on the page's purpose and main functionality.
```

---

## Directory Structure

```
prompts/
├── defaults/                      # Read-only reference prompts
│   ├── page-analysis.md          # For analyzePage()
│   ├── test-scenario-generation.md # For analyzeFlowForTests()
│   └── test-data-generation.md   # For generateEnhancedTestData()
├── page-analysis.md              # User-editable (copied from defaults)
├── test-scenario-generation.md   # User-editable
└── test-data-generation.md       # User-editable
```

---

## Validation Schema (YAML Frontmatter)

```yaml
# JSON Schema for frontmatter validation
type: object
required:
  - name
  - version
  - description
  - max_tokens
  - variables
properties:
  name:
    type: string
    pattern: "^[a-z][a-z0-9-]*$"
  version:
    type: string
    pattern: "^\\d+\\.\\d+\\.\\d+$"
  description:
    type: string
    minLength: 1
  max_tokens:
    type: integer
    minimum: 1
    maximum: 4096
  variables:
    type: array
    items:
      type: object
      required:
        - name
        - required
        - description
      properties:
        name:
          type: string
          pattern: "^[a-z_][a-z0-9_]*$"
        required:
          type: boolean
        description:
          type: string
        default:
          type: string
```
