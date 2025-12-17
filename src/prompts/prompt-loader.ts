/**
 * Prompt loader with caching and fallback support.
 * Feature: 001-ai-system-prompts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  SystemPrompt,
  PromptLoaderOptions,
  PromptSource,
  PromptContext,
  PromptRenderResult,
} from './types';
import { parsePromptFile, validatePromptContent } from './prompt-validator';
import { renderTemplate } from './template-engine';
import { createPromptError, PromptErrorType, PromptError } from './errors';
import { getLogger } from '../utils/logger';

let config: PromptLoaderOptions | undefined;
const promptCache: Map<string, SystemPrompt> = new Map();

/**
 * Initializes the prompt loader with configuration.
 * Must be called before loading prompts.
 *
 * @param options - Configuration options
 */
export function initializePromptLoader(options?: PromptLoaderOptions): void {
  config = {
    promptsDir: options?.promptsDir || path.join(process.cwd(), 'prompts'),
    verbose: options?.verbose || false,
  };
  promptCache.clear();
}

/**
 * Gets the current prompt loader configuration.
 * Returns undefined if not initialized.
 */
export function getPromptLoaderConfig(): PromptLoaderOptions | undefined {
  return config;
}

/**
 * Clears the in-memory prompt cache.
 * Forces prompts to be reloaded from disk on next access.
 */
export function clearPromptCache(): void {
  promptCache.clear();
}

/**
 * Gets the paths for a prompt (user and default).
 * Useful for debugging and CLI output.
 *
 * @param name - Prompt identifier
 * @returns Object with user and default paths
 */
export function getPromptPaths(name: string): {
  userPath: string;
  defaultPath: string;
} {
  const baseDir = config?.promptsDir || path.join(process.cwd(), 'prompts');
  return {
    userPath: path.join(baseDir, `${name}.md`),
    defaultPath: path.join(baseDir, 'defaults', `${name}.md`),
  };
}

/**
 * Loads a prompt by name from the filesystem.
 * Attempts user prompt first, falls back to default if not found.
 *
 * @param name - Prompt identifier (e.g., 'page-analysis')
 * @returns Promise resolving to the loaded SystemPrompt
 * @throws PromptError if prompt cannot be loaded
 */
export async function loadPrompt(name: string): Promise<SystemPrompt> {
  // Check cache
  const cached = promptCache.get(name);
  if (cached) {
    return cached;
  }

  const logger = getLogger();
  const paths = getPromptPaths(name);
  const verbose = config?.verbose || false;

  // Try user prompt first
  try {
    const content = await fs.readFile(paths.userPath, 'utf-8');
    const source: PromptSource = {
      type: 'user',
      filePath: paths.userPath,
      isFallback: false,
    };

    if (verbose) {
      logger.debug(`Loading prompt '${name}' from ${paths.userPath}`);
    }

    const prompt = parsePromptFile(content, paths.userPath, source);
    promptCache.set(name, prompt);

    if (verbose) {
      logger.debug(
        `Prompt '${name}' loaded successfully (${prompt.templateContent.length} characters)`
      );
    }

    return prompt;
  } catch (error) {
    // Check if it's a validation error (user file exists but is invalid)
    if (error instanceof Error && error.name === 'PromptError') {
      if (verbose) {
        logger.warn(
          `User prompt '${name}' is invalid, falling back to default: ${error.message}`
        );
      }
    } else if (verbose) {
      logger.debug(`User prompt not found for '${name}', trying default`);
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

    if (verbose) {
      logger.debug(`Loading default prompt '${name}' from ${paths.defaultPath}`);
    }

    const prompt = parsePromptFile(content, paths.defaultPath, source);
    promptCache.set(name, prompt);

    if (verbose) {
      logger.debug(
        `Default prompt '${name}' loaded (${prompt.templateContent.length} characters)`
      );
    }

    return prompt;
  } catch (error) {
    throw createPromptError(PromptErrorType.FILE_NOT_FOUND, `Prompt '${name}' not found`, {
      filePath: paths.defaultPath,
      suggestions: [
        `Create prompt file at ${paths.userPath}`,
        `Or ensure default exists at ${paths.defaultPath}`,
      ],
      cause: error instanceof Error ? error : undefined,
    });
  }
}

/**
 * Renders a prompt template with the provided context variables.
 *
 * @param prompt - The loaded SystemPrompt to render
 * @param context - Variables and options for rendering
 * @returns The rendered prompt result
 * @throws PromptError if required variables are missing
 */
export function renderPrompt(
  prompt: SystemPrompt,
  context: PromptContext
): PromptRenderResult {
  const logger = getLogger();
  const verbose = context.verbose || config?.verbose || false;

  const { rendered, substituted, missingOptional } = renderTemplate(
    prompt.templateContent,
    context,
    prompt.variables,
    prompt.source.filePath
  );

  if (verbose && substituted.length > 0) {
    logger.debug(`Substituted ${substituted.length} variables: ${substituted.join(', ')}`);
  }

  if (verbose && missingOptional.length > 0) {
    logger.debug(`Missing optional variables: ${missingOptional.join(', ')}`);
  }

  return {
    renderedContent: rendered,
    source: prompt.source,
    substitutedVariables: substituted,
    missingOptionalVariables: missingOptional,
    maxTokens: prompt.maxTokens,
  };
}

/**
 * Convenience function: loads and renders a prompt in one call.
 *
 * @param name - Prompt identifier
 * @param context - Variables and options for rendering
 * @returns Promise resolving to the rendered prompt result
 */
export async function loadAndRenderPrompt(
  name: string,
  context: PromptContext
): Promise<PromptRenderResult> {
  const prompt = await loadPrompt(name);
  return renderPrompt(prompt, context);
}

/**
 * Lists all available prompt names.
 * Returns both user and default prompts, with user prompts taking precedence.
 *
 * @returns Promise resolving to array of prompt names
 */
export async function listPrompts(): Promise<string[]> {
  const baseDir = config?.promptsDir || path.join(process.cwd(), 'prompts');
  const defaultsDir = path.join(baseDir, 'defaults');
  const names = new Set<string>();

  // Get user prompts
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        names.add(entry.name.replace('.md', ''));
      }
    }
  } catch {
    // User directory may not exist
  }

  // Get default prompts
  try {
    const entries = await fs.readdir(defaultsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        names.add(entry.name.replace('.md', ''));
      }
    }
  } catch {
    // Defaults directory may not exist
  }

  return Array.from(names).sort();
}

/**
 * Checks if a prompt exists (either user or default).
 *
 * @param name - Prompt identifier to check
 * @returns Promise resolving to true if prompt exists
 */
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

/**
 * Validates a prompt file without loading it into the registry.
 *
 * @param filePath - Path to the prompt file to validate
 * @returns Promise resolving to validation result
 */
export async function validatePromptFile(filePath: string): Promise<{
  valid: boolean;
  errors: PromptError[];
  warnings: string[];
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return validatePromptContent(content, filePath);
  } catch (error) {
    return {
      valid: false,
      errors: [
        createPromptError(PromptErrorType.FILE_NOT_FOUND, `Cannot read file: ${filePath}`, {
          filePath,
          cause: error instanceof Error ? error : undefined,
        }),
      ],
      warnings: [],
    };
  }
}

/**
 * Validates a context against a prompt's variable requirements.
 *
 * @param prompt - The SystemPrompt to validate against
 * @param context - The context to validate
 * @returns Validation result with any missing required variables
 */
export function validateContext(
  prompt: SystemPrompt,
  context: PromptContext
): {
  valid: boolean;
  missingRequired: string[];
  unusedProvided: string[];
} {
  const missingRequired: string[] = [];
  const unusedProvided: string[] = [];

  const variableNames = new Set(prompt.variables.map((v) => v.name));
  const providedNames = new Set(Object.keys(context.variables));

  // Check for missing required variables
  for (const variable of prompt.variables) {
    if (variable.required && context.variables[variable.name] === undefined) {
      missingRequired.push(variable.name);
    }
  }

  // Check for unused provided variables
  for (const provided of providedNames) {
    if (!variableNames.has(provided)) {
      unusedProvided.push(provided);
    }
  }

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    unusedProvided,
  };
}

/**
 * Resets a single prompt to its default version.
 * Copies from defaults/ to the user prompts directory.
 *
 * @param name - Prompt identifier to reset
 * @param options - Reset options
 * @throws PromptError if default prompt doesn't exist
 */
export async function resetPrompt(
  name: string,
  _options?: { force?: boolean }
): Promise<void> {
  const paths = getPromptPaths(name);

  // Check if default exists
  try {
    await fs.access(paths.defaultPath);
  } catch {
    throw createPromptError(
      PromptErrorType.FILE_NOT_FOUND,
      `Default prompt not found for '${name}'`,
      {
        filePath: paths.defaultPath,
        suggestions: [
          `Expected location: ${paths.defaultPath}`,
          'This may indicate a corrupted installation. Try reinstalling the package.',
        ],
      }
    );
  }

  // Copy default to user location
  const content = await fs.readFile(paths.defaultPath, 'utf-8');

  // Ensure user prompts directory exists
  const userDir = path.dirname(paths.userPath);
  await fs.mkdir(userDir, { recursive: true });

  await fs.writeFile(paths.userPath, content, 'utf-8');

  // Clear cache for this prompt
  promptCache.delete(name);
}

/**
 * Resets all prompts to their default versions.
 *
 * @param options - Reset options
 * @returns Promise resolving to array of reset prompt names
 */
export async function resetAllPrompts(options?: { force?: boolean }): Promise<string[]> {
  const baseDir = config?.promptsDir || path.join(process.cwd(), 'prompts');
  const defaultsDir = path.join(baseDir, 'defaults');
  const reset: string[] = [];

  try {
    const entries = await fs.readdir(defaultsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const name = entry.name.replace('.md', '');
        await resetPrompt(name, options);
        reset.push(name);
      }
    }
  } catch {
    // Defaults directory may not exist
  }

  return reset;
}

/**
 * Initializes prompts directory by copying defaults if needed.
 * Called on first AI command run to set up user-editable copies.
 */
export async function initializePromptsDirectory(): Promise<void> {
  const baseDir = config?.promptsDir || path.join(process.cwd(), 'prompts');
  const defaultsDir = path.join(baseDir, 'defaults');
  const logger = getLogger();
  const verbose = config?.verbose || false;

  // Check if user prompts directory exists
  try {
    await fs.access(baseDir);
    // Directory exists, check if any user prompts exist
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const hasUserPrompts = entries.some(
      (e) => e.isFile() && e.name.endsWith('.md')
    );
    if (hasUserPrompts) {
      return; // User already has prompts
    }
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(baseDir, { recursive: true });
  }

  // Copy defaults to user prompts directory
  try {
    const entries = await fs.readdir(defaultsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const name = entry.name.replace('.md', '');
        const defaultPath = path.join(defaultsDir, entry.name);
        const userPath = path.join(baseDir, entry.name);

        try {
          await fs.access(userPath);
          // User file exists, skip
        } catch {
          // Copy default to user location
          const content = await fs.readFile(defaultPath, 'utf-8');
          await fs.writeFile(userPath, content, 'utf-8');
          if (verbose) {
            logger.debug(`Initialized prompt '${name}' from defaults`);
          }
        }
      }
    }
  } catch {
    // Defaults directory doesn't exist - this is fine for new installs
  }
}
