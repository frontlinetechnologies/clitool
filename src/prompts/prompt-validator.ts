/**
 * YAML frontmatter parser and validator for prompt files.
 * Feature: 001-ai-system-prompts
 */

import { SystemPrompt, PromptVariable, PromptSource } from './types';
import { createPromptError, PromptErrorType, PromptError } from './errors';

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

/**
 * Parses a prompt file and validates its structure.
 *
 * @param content - Raw file content
 * @param filePath - File path for error messages
 * @param source - Source information
 * @returns Parsed SystemPrompt
 * @throws PromptError if parsing or validation fails
 */
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
          'Add frontmatter section with name, version, description, max_tokens, and variables',
        ],
      }
    );
  }

  const [, frontmatterYaml, templateContent] = match;
  const frontmatter = parseYamlFrontmatter(frontmatterYaml, filePath);

  validateRequiredFields(frontmatter, filePath);

  return {
    name: frontmatter.name!,
    version: frontmatter.version!,
    description: frontmatter.description!,
    maxTokens: frontmatter.max_tokens!,
    variables: parseVariables(frontmatter.variables || [], filePath),
    templateContent: templateContent.trim(),
    source,
    loadedAt: new Date(),
  };
}

interface ParsedFrontmatter {
  name?: string;
  version?: string;
  description?: string;
  max_tokens?: number;
  variables?: ParsedVariable[];
}

interface ParsedVariable {
  name?: string;
  required?: boolean;
  description?: string;
  default?: string;
  [key: string]: unknown;
}

/**
 * Simple YAML parser for frontmatter (no external dependency).
 * Handles basic key-value pairs and arrays of objects.
 */
function parseYamlFrontmatter(yaml: string, _filePath: string): ParsedFrontmatter {
  const result: ParsedFrontmatter = {};
  let currentKey: string | null = null;
  let inArray = false;
  let arrayItems: ParsedVariable[] = [];
  let currentArrayItem: ParsedVariable | null = null;

  const lines = yaml.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    // Calculate indentation level
    const indent = line.length - line.trimStart().length;

    if (trimmed.startsWith('- ')) {
      // Array item start
      if (inArray && currentKey) {
        const itemContent = trimmed.substring(2).trim();
        if (itemContent.includes(':')) {
          // Object in array - start new item
          if (currentArrayItem) {
            arrayItems.push(currentArrayItem);
          }
          currentArrayItem = {};
          parseKeyValue(itemContent, currentArrayItem);
        } else {
          // Simple array item
          if (currentArrayItem) {
            arrayItems.push(currentArrayItem);
            currentArrayItem = null;
          }
        }
      }
    } else if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Check if this is a continuation of an array item object
      if (inArray && currentArrayItem && indent > 2) {
        parseKeyValue(trimmed, currentArrayItem);
        continue;
      }

      // Save previous array if exists
      if (inArray && currentKey) {
        if (currentArrayItem) {
          arrayItems.push(currentArrayItem);
          currentArrayItem = null;
        }
        (result as Record<string, unknown>)[currentKey] = arrayItems;
        arrayItems = [];
        inArray = false;
      }

      if (value === '') {
        // Array or object starts
        currentKey = key;
        inArray = true;
        arrayItems = [];
        currentArrayItem = null;
      } else {
        (result as Record<string, unknown>)[key] = parseValue(value);
        currentKey = null;
        inArray = false;
      }
    }
  }

  // Save final array if exists
  if (inArray && currentKey) {
    if (currentArrayItem) {
      arrayItems.push(currentArrayItem);
    }
    (result as Record<string, unknown>)[currentKey] = arrayItems;
  }

  return result;
}

function parseKeyValue(line: string, obj: Record<string, unknown>): void {
  const colonIndex = line.indexOf(':');
  if (colonIndex > -1) {
    let key = line.substring(0, colonIndex).trim();
    // Remove leading '- ' if present
    if (key.startsWith('- ')) {
      key = key.substring(2);
    }
    const value = line.substring(colonIndex + 1).trim();
    obj[key] = parseValue(value);
  }
}

function parseValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function parseVariables(vars: ParsedVariable[], filePath: string): PromptVariable[] {
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

function validateRequiredFields(frontmatter: ParsedFrontmatter, filePath: string): void {
  const required: (keyof ParsedFrontmatter)[] = ['name', 'version', 'description', 'max_tokens'];

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

/**
 * Validates a prompt file without loading it into the registry.
 * Useful for validating user edits before running commands.
 *
 * @param content - Raw file content
 * @param filePath - Path to the file being validated
 * @returns Validation result with errors and warnings
 */
export function validatePromptContent(
  content: string,
  filePath: string
): { valid: boolean; errors: PromptError[]; warnings: string[] } {
  const errors: PromptError[] = [];
  const warnings: string[] = [];

  try {
    const source: PromptSource = {
      type: 'user',
      filePath,
      isFallback: false,
    };
    parsePromptFile(content, filePath, source);
  } catch (error) {
    if (error instanceof Error && error.name === 'PromptError') {
      errors.push(error as PromptError);
    } else {
      errors.push(
        createPromptError(PromptErrorType.PARSE_ERROR, String(error), {
          filePath,
        })
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
