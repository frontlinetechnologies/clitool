# Research: AI System Prompts

**Feature**: 001-ai-system-prompts
**Date**: 2025-12-17

## Research Summary

This document captures research findings for implementing the AI System Prompts feature, resolving all technical unknowns identified during planning.

---

## 1. Prompt File Format

### Decision: Markdown with YAML Frontmatter

### Rationale
- Markdown is already familiar to the target audience (developers)
- YAML frontmatter provides structured metadata without requiring a separate schema file
- Syntax highlighting available in all code editors
- Human-readable while supporting machine parsing
- Aligns with Constitution Article IX: Documentation as Code

### Alternatives Considered
| Format | Rejected Because |
|--------|-----------------|
| JSON | Less readable, no inline comments, awkward for multi-line text |
| YAML only | Less natural for long prompt text |
| Plain text | No structured metadata support |
| Handlebars/Mustache | Adds dependency, over-engineering for simple substitution |

### Chosen Format
```markdown
---
name: page-analysis
version: 1.0.0
description: Analyzes web pages to generate human-readable descriptions
variables:
  - name: url
    required: true
    description: The URL of the page being analyzed
  - name: title
    required: false
    description: The page title (if available)
  - name: content
    required: false
    description: Page content preview
max_tokens: 500
---

# Page Analysis Prompt

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

## 2. Variable Substitution Syntax

### Decision: Double curly braces `{{variable}}` with optional conditionals

### Rationale
- Familiar syntax (widely used in templating)
- Unambiguous - unlikely to appear in prompt text
- Simple regex replacement for basic cases
- Can be extended with `{{#if var}}...{{/if}}` blocks for optional sections
- No external dependency required

### Implementation Approach
```typescript
// Basic substitution: {{variable}}
const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

// Conditional blocks: {{#if var}}...{{/if}}
const CONDITIONAL_REGEX = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
```

### Alternatives Considered
| Syntax | Rejected Because |
|--------|-----------------|
| `${variable}` | Conflicts with JavaScript template literals |
| `{variable}` | Single brace too common in JSON examples in prompts |
| `%variable%` | Less familiar, feels dated |
| Full Handlebars | Adds dependency (violates Article VI) |

---

## 3. Prompt Directory Location

### Decision: `prompts/` at project root for installed package, resolved dynamically

### Rationale
- Project root is where users expect configurable files (like `package.json`, `.eslintrc`)
- Easy to find without documentation
- Can be version-controlled with the project
- `prompts/defaults/` subdirectory keeps originals safe

### Resolution Strategy
```typescript
// Order of resolution:
// 1. User's project root: ./prompts/{name}.md
// 2. Fallback to defaults: ./prompts/defaults/{name}.md
// 3. Error if neither exists
```

### Alternatives Considered
| Location | Rejected Because |
|----------|-----------------|
| `~/.testarion/prompts/` | Hidden from project, harder to discover |
| `src/prompts/` | Mixes user config with source code |
| `.testarion/prompts/` | Hidden directory, less discoverable |

---

## 4. Existing Hardcoded Prompts to Externalize

### Finding: Three distinct prompt types in `anthropic-client.ts`

| Prompt | Function | Location | Variables |
|--------|----------|----------|-----------|
| Page Analysis | `buildAnalysisPrompt()` | Lines 108-125 | url, title, content |
| Test Scenario | `buildTestAnalysisPrompt()` | Lines 187-216 | flowType, pages, formFields |
| Test Data | Inline | Lines 262-263 | fieldType, context |

### Migration Strategy
1. Extract each hardcoded prompt to a Markdown file in `prompts/defaults/`
2. Update `anthropic-client.ts` to use the prompt loader
3. Ensure identical behavior with externalized prompts (regression test)

---

## 5. Validation Strategy

### Decision: Validate on load with clear error messages

### Validation Checks
1. **File exists** - Check user path, then defaults path
2. **UTF-8 encoding** - Validate file reads without encoding errors
3. **YAML frontmatter** - Parse and validate required fields
4. **Required variables** - Ensure all required variables are provided at render time
5. **Template syntax** - Check for malformed `{{}}` patterns

### Error Messages (per Article III)
```
Error: Missing required variable 'url' in prompt 'page-analysis'
  File: ./prompts/page-analysis.md
  Expected variables: url (required), title (optional), content (optional)

Error: Invalid prompt file format 'page-analysis.md'
  File: ./prompts/page-analysis.md
  Issue: Missing YAML frontmatter delimiter '---'
  Fix: Add frontmatter section at the start of the file

Warning: Using default prompt for 'page-analysis'
  Reason: User prompt file not found at ./prompts/page-analysis.md
  Source: ./prompts/defaults/page-analysis.md
```

---

## 6. Fallback Behavior

### Decision: Silent fallback with warning in verbose mode

### Behavior Matrix
| Scenario | User Prompt | Default Prompt | Behavior |
|----------|-------------|----------------|----------|
| Normal | ✅ Exists | ✅ Exists | Use user prompt |
| Customization reset | ❌ Missing | ✅ Exists | Use default, warn in verbose |
| Corrupted | ❌ Invalid | ✅ Exists | Use default, always warn |
| Both missing | ❌ Missing | ❌ Missing | Error, fail operation |

### Implementation
```typescript
async function loadPrompt(name: string, verbose: boolean): Promise<string> {
  const userPath = path.join(promptsDir, `${name}.md`);
  const defaultPath = path.join(promptsDir, 'defaults', `${name}.md`);

  // Try user prompt first
  try {
    return await fs.readFile(userPath, 'utf-8');
  } catch {
    // Fallback to default
    if (verbose) {
      logger.warn(`Using default prompt for '${name}'`);
    }
    return await fs.readFile(defaultPath, 'utf-8');
  }
}
```

---

## 7. Reset Command Design

### Decision: CLI subcommand `reset-prompts` with optional prompt name

### Usage
```bash
# Reset all prompts to defaults
npx @testarion/clitool reset-prompts

# Reset specific prompt
npx @testarion/clitool reset-prompts page-analysis

# List available prompts
npx @testarion/clitool reset-prompts --list
```

### Behavior
- Copy from `prompts/defaults/` to `prompts/`
- Warn before overwriting existing files
- `--force` flag to skip confirmation
- Exit 0 on success, 1 on error

---

## 8. Cross-Platform File Path Handling

### Decision: Use Node.js path module consistently

### Best Practices Applied
```typescript
import * as path from 'path';

// Always use path.join for concatenation
const promptPath = path.join(baseDir, 'prompts', `${name}.md`);

// Normalize paths for comparison
const normalizedPath = path.normalize(inputPath);

// Use path.resolve for absolute paths
const absolutePath = path.resolve(relativePath);
```

---

## 9. Logging Strategy

### Decision: Use existing logger with verbose flag

### Integration
- Prompt loading logged at DEBUG level
- Fallback usage logged at WARN level
- Variable substitution logged at DEBUG level
- All logs only shown when `--verbose` flag is set

### Example Log Output (verbose mode)
```
[DEBUG] Loading prompt 'page-analysis' from ./prompts/page-analysis.md
[DEBUG] Substituting 3 variables: url, title, content
[DEBUG] Prompt loaded successfully (1,234 characters)
```

---

## 10. Package Distribution

### Decision: Include defaults in npm package, copy to project on first use

### Distribution Strategy
1. `prompts/defaults/` included in npm package via `package.json` files array
2. On first AI command run, check if `prompts/` directory exists
3. If not, create directory and copy defaults as user-editable copies
4. Document this behavior in CLI help

### package.json Addition
```json
{
  "files": [
    "dist",
    "prompts/defaults"
  ]
}
```

---

## Research Conclusions

All technical unknowns have been resolved. Key decisions:

1. **Format**: Markdown with YAML frontmatter
2. **Syntax**: `{{variable}}` with `{{#if}}` conditionals
3. **Location**: `prompts/` at project root
4. **Validation**: On-load with actionable errors
5. **Fallback**: Silent with verbose warnings
6. **Reset**: CLI subcommand with selective reset
7. **Distribution**: Defaults bundled, copied on first use

Ready to proceed to Phase 1: Design & Contracts.
