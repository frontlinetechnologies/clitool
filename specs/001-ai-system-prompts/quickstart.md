# Quickstart: AI System Prompts Implementation

**Feature**: 001-ai-system-prompts
**Date**: 2025-12-17

## Overview

This guide provides step-by-step instructions for implementing the AI System Prompts feature. Follow this guide to implement the feature from start to finish.

---

## Prerequisites

Before starting, ensure you have:

1. Node.js 18+ installed
2. Repository cloned and dependencies installed (`npm install`)
3. Familiarity with the existing codebase structure
4. Read the [spec.md](./spec.md) and [data-model.md](./data-model.md)

---

## Implementation Steps

### Step 1: Create the Prompts Module Structure

Create the following directory and files:

```bash
mkdir -p src/prompts
touch src/prompts/index.ts
touch src/prompts/prompt-loader.ts
touch src/prompts/prompt-validator.ts
touch src/prompts/template-engine.ts
touch src/prompts/errors.ts
touch src/prompts/types.ts
```

### Step 2: Implement Types (`src/prompts/types.ts`)

Copy the type definitions from [contracts/prompt-module-api.ts](./contracts/prompt-module-api.ts):

```typescript
// src/prompts/types.ts
export interface PromptVariable {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

export interface PromptSource {
  type: 'user' | 'default';
  filePath: string;
  isFallback: boolean;
}

export interface SystemPrompt {
  name: string;
  version: string;
  description: string;
  maxTokens: number;
  variables: PromptVariable[];
  templateContent: string;
  source: PromptSource;
  loadedAt: Date;
}

// ... rest of types from contract
```

### Step 3: Implement Error Handling (`src/prompts/errors.ts`)

Follow the existing error pattern from `src/documentation/errors.ts`:

```typescript
// src/prompts/errors.ts
export enum PromptErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PARSE_ERROR = 'PARSE_ERROR',
  INVALID_FRONTMATTER = 'INVALID_FRONTMATTER',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_VARIABLE = 'INVALID_VARIABLE',
  ENCODING_ERROR = 'ENCODING_ERROR',
  TEMPLATE_SYNTAX_ERROR = 'TEMPLATE_SYNTAX_ERROR',
  MISSING_REQUIRED_VARIABLE = 'MISSING_REQUIRED_VARIABLE',
}

export interface PromptError extends Error {
  type: PromptErrorType;
  filePath: string;
  field?: string;
  suggestions: string[];
}

export function createPromptError(
  type: PromptErrorType,
  message: string,
  options: {
    filePath: string;
    field?: string;
    suggestions?: string[];
    cause?: Error;
  }
): PromptError {
  const error = new Error(message) as PromptError;
  error.name = 'PromptError';
  error.type = type;
  error.filePath = options.filePath;
  error.field = options.field;
  error.suggestions = options.suggestions || [];
  if (options.cause) {
    error.cause = options.cause;
  }
  return error;
}

export function isPromptError(error: unknown): error is PromptError {
  return error instanceof Error && error.name === 'PromptError';
}
```

### Step 4: Implement Template Engine (`src/prompts/template-engine.ts`)

Simple template substitution without external dependencies:

```typescript
// src/prompts/template-engine.ts
import { PromptVariable, PromptContext } from './types';
import { createPromptError, PromptErrorType } from './errors';

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;
const CONDITIONAL_REGEX = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

export function renderTemplate(
  template: string,
  context: PromptContext,
  variables: PromptVariable[],
  filePath: string
): { rendered: string; substituted: string[]; missingOptional: string[] } {
  const substituted: string[] = [];
  const missingOptional: string[] = [];

  // Check for missing required variables
  for (const variable of variables) {
    if (variable.required && context.variables[variable.name] === undefined) {
      throw createPromptError(
        PromptErrorType.MISSING_REQUIRED_VARIABLE,
        `Missing required variable '${variable.name}'`,
        {
          filePath,
          field: variable.name,
          suggestions: [
            `Provide '${variable.name}' in the context.variables object`,
            `Variable description: ${variable.description}`,
          ],
        }
      );
    }
  }

  // Process conditionals first
  let rendered = template.replace(CONDITIONAL_REGEX, (_, varName, content) => {
    const value = context.variables[varName];
    if (value !== undefined && value !== '') {
      return content;
    }
    return '';
  });

  // Then substitute variables
  rendered = rendered.replace(VARIABLE_REGEX, (match, varName) => {
    const value = context.variables[varName];
    const varDef = variables.find((v) => v.name === varName);

    if (value !== undefined) {
      substituted.push(varName);
      return value;
    }

    if (varDef?.defaultValue !== undefined) {
      substituted.push(varName);
      return varDef.defaultValue;
    }

    if (varDef && !varDef.required) {
      missingOptional.push(varName);
      return '';
    }

    // Unknown variable - leave as-is for debugging
    return match;
  });

  return { rendered, substituted, missingOptional };
}
```

### Step 5: Implement Prompt Validator (`src/prompts/prompt-validator.ts`)

Parse YAML frontmatter and validate structure:

```typescript
// src/prompts/prompt-validator.ts
import { SystemPrompt, PromptVariable, PromptSource } from './types';
import { createPromptError, PromptErrorType } from './errors';

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

export function parsePromptFile(
  content: string,
  filePath: string,
  source: PromptSource
): SystemPrompt {
  const match = content.match(FRONTMATTER_REGEX);

  if (!match) {
    throw createPromptError(
      PromptErrorType.INVALID_FRONTMATTER,
      'Missing or invalid YAML frontmatter',
      {
        filePath,
        suggestions: [
          "Ensure the file starts with '---'",
          "Add frontmatter section with name, version, description, max_tokens, and variables",
        ],
      }
    );
  }

  const [, frontmatterYaml, templateContent] = match;
  const frontmatter = parseYamlFrontmatter(frontmatterYaml, filePath);

  validateRequiredFields(frontmatter, filePath);

  return {
    name: frontmatter.name,
    version: frontmatter.version,
    description: frontmatter.description,
    maxTokens: frontmatter.max_tokens,
    variables: parseVariables(frontmatter.variables || [], filePath),
    templateContent: templateContent.trim(),
    source,
    loadedAt: new Date(),
  };
}

function parseYamlFrontmatter(yaml: string, filePath: string): any {
  // Simple YAML parser for frontmatter (no external dependency)
  // For production, consider using 'yaml' package for full YAML support
  const result: any = {};
  let currentKey: string | null = null;
  let inArray = false;
  let arrayItems: any[] = [];

  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('- ')) {
      // Array item
      if (inArray && currentKey) {
        const itemContent = trimmed.substring(2);
        if (itemContent.includes(':')) {
          // Object in array
          const obj: any = {};
          parseArrayObject(obj, itemContent);
          arrayItems.push(obj);
        } else {
          arrayItems.push(itemContent);
        }
      }
    } else if (trimmed.includes(':')) {
      // Key-value pair
      if (inArray && currentKey) {
        // Check if it's a continuation of array item object
        const lastItem = arrayItems[arrayItems.length - 1];
        if (typeof lastItem === 'object') {
          parseArrayObject(lastItem, trimmed);
          continue;
        }
      }

      // Save previous array if exists
      if (inArray && currentKey) {
        result[currentKey] = arrayItems;
        arrayItems = [];
        inArray = false;
      }

      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (value === '') {
        // Array or object starts
        currentKey = key;
        inArray = true;
        arrayItems = [];
      } else {
        result[key] = parseValue(value);
        currentKey = null;
        inArray = false;
      }
    }
  }

  // Save final array if exists
  if (inArray && currentKey) {
    result[currentKey] = arrayItems;
  }

  return result;
}

function parseArrayObject(obj: any, line: string): void {
  const colonIndex = line.indexOf(':');
  if (colonIndex > -1) {
    const key = line.substring(0, colonIndex).trim().replace(/^-\s*/, '');
    const value = line.substring(colonIndex + 1).trim();
    obj[key] = parseValue(value);
  }
}

function parseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  return value;
}

function parseVariables(vars: any[], filePath: string): PromptVariable[] {
  return vars.map((v, index) => {
    if (!v.name) {
      throw createPromptError(
        PromptErrorType.INVALID_VARIABLE,
        `Variable at index ${index} missing 'name' field`,
        { filePath, field: `variables[${index}]` }
      );
    }
    return {
      name: v.name,
      required: v.required ?? true,
      description: v.description || '',
      defaultValue: v.default,
    };
  });
}

function validateRequiredFields(frontmatter: any, filePath: string): void {
  const required = ['name', 'version', 'description', 'max_tokens'];

  for (const field of required) {
    if (frontmatter[field] === undefined) {
      throw createPromptError(
        PromptErrorType.MISSING_REQUIRED_FIELD,
        `Missing required field '${field}' in frontmatter`,
        {
          filePath,
          field,
          suggestions: [`Add '${field}:' to the frontmatter section`],
        }
      );
    }
  }
}
```

### Step 6: Implement Prompt Loader (`src/prompts/prompt-loader.ts`)

Main loader with caching and fallback:

```typescript
// src/prompts/prompt-loader.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { SystemPrompt, PromptLoaderOptions, PromptSource, PromptContext, PromptRenderResult } from './types';
import { parsePromptFile } from './prompt-validator';
import { renderTemplate } from './template-engine';
import { createPromptError, PromptErrorType } from './errors';
import { getLogger } from '../utils/logger';

let config: PromptLoaderOptions | undefined;
let promptCache: Map<string, SystemPrompt> = new Map();

export function initializePromptLoader(options?: PromptLoaderOptions): void {
  config = {
    promptsDir: options?.promptsDir || path.join(process.cwd(), 'prompts'),
    verbose: options?.verbose || false,
  };
  promptCache.clear();
}

export function getPromptLoaderConfig(): PromptLoaderOptions | undefined {
  return config;
}

export function clearPromptCache(): void {
  promptCache.clear();
}

export function getPromptPaths(name: string): { userPath: string; defaultPath: string } {
  const baseDir = config?.promptsDir || path.join(process.cwd(), 'prompts');
  return {
    userPath: path.join(baseDir, `${name}.md`),
    defaultPath: path.join(baseDir, 'defaults', `${name}.md`),
  };
}

export async function loadPrompt(name: string): Promise<SystemPrompt> {
  // Check cache
  const cached = promptCache.get(name);
  if (cached) {
    return cached;
  }

  const logger = getLogger();
  const paths = getPromptPaths(name);

  // Try user prompt first
  try {
    const content = await fs.readFile(paths.userPath, 'utf-8');
    const source: PromptSource = {
      type: 'user',
      filePath: paths.userPath,
      isFallback: false,
    };

    if (config?.verbose) {
      logger.debug(`Loading prompt '${name}' from ${paths.userPath}`);
    }

    const prompt = parsePromptFile(content, paths.userPath, source);
    promptCache.set(name, prompt);
    return prompt;
  } catch (error) {
    // Fall back to default
    if (config?.verbose) {
      logger.warn(`User prompt not found for '${name}', using default`);
    }
  }

  // Try default prompt
  try {
    const content = await fs.readFile(paths.defaultPath, 'utf-8');
    const source: PromptSource = {
      type: 'default',
      filePath: paths.defaultPath,
      isFallback: true,
    };

    if (config?.verbose) {
      logger.debug(`Loading default prompt '${name}' from ${paths.defaultPath}`);
    }

    const prompt = parsePromptFile(content, paths.defaultPath, source);
    promptCache.set(name, prompt);
    return prompt;
  } catch (error) {
    throw createPromptError(
      PromptErrorType.FILE_NOT_FOUND,
      `Prompt '${name}' not found`,
      {
        filePath: paths.defaultPath,
        suggestions: [
          `Create prompt file at ${paths.userPath}`,
          `Or ensure default exists at ${paths.defaultPath}`,
        ],
      }
    );
  }
}

export function renderPrompt(prompt: SystemPrompt, context: PromptContext): PromptRenderResult {
  const { rendered, substituted, missingOptional } = renderTemplate(
    prompt.templateContent,
    context,
    prompt.variables,
    prompt.source.filePath
  );

  return {
    renderedContent: rendered,
    source: prompt.source,
    substitutedVariables: substituted,
    missingOptionalVariables: missingOptional,
    maxTokens: prompt.maxTokens,
  };
}

export async function loadAndRenderPrompt(
  name: string,
  context: PromptContext
): Promise<PromptRenderResult> {
  const prompt = await loadPrompt(name);
  return renderPrompt(prompt, context);
}

export async function listPrompts(): Promise<string[]> {
  const baseDir = config?.promptsDir || path.join(process.cwd(), 'prompts');
  const defaultsDir = path.join(baseDir, 'defaults');
  const names = new Set<string>();

  // Get user prompts
  try {
    const userFiles = await fs.readdir(baseDir);
    for (const file of userFiles) {
      if (file.endsWith('.md')) {
        names.add(file.replace('.md', ''));
      }
    }
  } catch {
    // User directory may not exist
  }

  // Get default prompts
  try {
    const defaultFiles = await fs.readdir(defaultsDir);
    for (const file of defaultFiles) {
      if (file.endsWith('.md')) {
        names.add(file.replace('.md', ''));
      }
    }
  } catch {
    // Defaults directory may not exist
  }

  return Array.from(names).sort();
}

export async function promptExists(name: string): Promise<boolean> {
  const paths = getPromptPaths(name);

  try {
    await fs.access(paths.userPath);
    return true;
  } catch {
    try {
      await fs.access(paths.defaultPath);
      return true;
    } catch {
      return false;
    }
  }
}
```

### Step 7: Create Default Prompt Files

Create `prompts/defaults/` directory with initial prompts:

```bash
mkdir -p prompts/defaults
```

**prompts/defaults/page-analysis.md:**
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

**prompts/defaults/test-scenario-generation.md:**
```markdown
---
name: test-scenario-generation
version: 1.0.0
description: Generates additional test scenarios for web flows
max_tokens: 1000
variables:
  - name: flowType
    required: true
    description: Type of flow (login, checkout, form-submission)
  - name: pages
    required: true
    description: Pages in the flow, joined with ' -> '
  - name: formFields
    required: true
    description: Form fields, joined with ', '
---

Analyze this web flow and suggest additional test scenarios.

Flow Type: {{flowType}}
Pages in flow: {{pages}}
Form fields: {{formFields}}

Generate 1-2 additional test scenarios that would be valuable for this flow. For each scenario, provide:
- A descriptive name
- A brief description
- Key test steps
- Important assertions to verify

Focus on:
1. Error handling (invalid inputs, edge cases)
2. User experience (clear feedback, validation messages)
3. Security considerations (if applicable)

Format your response as JSON:
[
  {
    "name": "scenario name",
    "description": "brief description",
    "steps": ["step 1", "step 2"],
    "assertions": ["assertion 1", "assertion 2"]
  }
]
```

**prompts/defaults/test-data-generation.md:**
```markdown
---
name: test-data-generation
version: 1.0.0
description: Generates realistic test values for form fields
max_tokens: 100
variables:
  - name: fieldType
    required: true
    description: Type of the field (email, password, text, etc.)
  - name: context
    required: true
    description: Additional context about the field (name, placeholder, etc.)
---

Generate a realistic test value for a {{fieldType}} field with context: {{context}}.

Respond with just the value, no explanation. For example, for an email field, respond with just "john.doe@example.com".
```

### Step 8: Integrate with Anthropic Client

Update `src/ai/anthropic-client.ts` to use the prompt loader:

```typescript
// Add imports
import { loadAndRenderPrompt, initializePromptLoader } from '../prompts';

// Update analyzePage function
export async function analyzePage(
  pageUrl: string,
  pageTitle?: string,
  pageContent?: string,
  apiKey?: string,
  verbose?: boolean,
): Promise<string | null> {
  const apiClient = initializeClient(apiKey);
  if (!apiClient) {
    return null;
  }

  try {
    // Initialize prompt loader if needed
    initializePromptLoader({ verbose });

    // Load and render prompt
    const { renderedContent, maxTokens } = await loadAndRenderPrompt('page-analysis', {
      variables: {
        url: pageUrl,
        title: pageTitle,
        content: pageContent ? (pageContent.length > 2000 ? pageContent.substring(0, 2000) + '...' : pageContent) : undefined,
      },
      verbose,
    });

    const response = await apiClient.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: renderedContent }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }
    return null;
  } catch (error) {
    return null;
  }
}
```

### Step 9: Implement Reset Command

Create `src/cli/reset-prompts.ts` following the contract in [contracts/reset-prompts-cli.md](./contracts/reset-prompts-cli.md).

### Step 10: Update package.json

Add the new command to bin:

```json
{
  "bin": {
    "crawl": "./dist/cli/crawl.js",
    "generate-docs": "./dist/cli/generate-docs.js",
    "generate-tests": "./dist/cli/generate-tests.js",
    "reset-prompts": "./dist/cli/reset-prompts.js"
  },
  "files": [
    "dist",
    "prompts/defaults"
  ]
}
```

### Step 11: Write Tests

Create test files in `tests/unit/prompts/`:

1. `prompt-loader.test.ts` - Test loading, caching, fallback
2. `prompt-validator.test.ts` - Test frontmatter parsing, validation
3. `template-engine.test.ts` - Test variable substitution, conditionals
4. `integration/prompt-integration.test.ts` - Test end-to-end flow

---

## Verification Checklist

After implementation, verify:

- [ ] `npm run build` succeeds
- [ ] `npm test` passes with >80% coverage for new code
- [ ] `npm run lint` passes
- [ ] Default prompts exist in `prompts/defaults/`
- [ ] Existing AI features work with externalized prompts
- [ ] Verbose mode logs prompt loading
- [ ] Fallback to defaults works when user prompts missing
- [ ] Reset command resets prompts correctly
- [ ] Cross-platform paths work (test on Windows if possible)

---

## Common Pitfalls

1. **Forgetting async**: `loadPrompt` is async - ensure callers await it
2. **Path separators**: Always use `path.join`, never string concatenation
3. **Cache invalidation**: Call `clearPromptCache()` in tests
4. **Encoding**: Ensure UTF-8 encoding when reading/writing files
5. **Error handling**: Don't swallow errors - use the typed PromptError system
