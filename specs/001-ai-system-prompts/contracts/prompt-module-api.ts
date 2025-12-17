/**
 * Contract: Prompt Module Public API
 * Feature: 001-ai-system-prompts
 *
 * This file defines the public interface for the prompt management module.
 * Implementation must conform to this contract.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Prompt variable definition from frontmatter.
 */
export interface PromptVariable {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

/**
 * Source information for a loaded prompt.
 */
export interface PromptSource {
  type: 'user' | 'default';
  filePath: string;
  isFallback: boolean;
}

/**
 * Loaded and parsed system prompt.
 */
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

/**
 * Context for rendering a prompt template.
 */
export interface PromptContext {
  variables: Record<string, string | undefined>;
  verbose?: boolean;
}

/**
 * Result of rendering a prompt.
 */
export interface PromptRenderResult {
  renderedContent: string;
  source: PromptSource;
  substitutedVariables: string[];
  missingOptionalVariables: string[];
  maxTokens: number;
}

/**
 * Error types for prompt operations.
 */
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

/**
 * Custom error for prompt-related failures.
 */
export interface PromptError extends Error {
  type: PromptErrorType;
  filePath: string;
  field?: string;
  suggestions: string[];
}

/**
 * Configuration options for the prompt loader.
 */
export interface PromptLoaderOptions {
  /** Base directory for prompts (defaults to project root 'prompts/') */
  promptsDir?: string;
  /** Whether to enable verbose logging */
  verbose?: boolean;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Initializes the prompt loader with configuration.
 * Must be called before loading prompts.
 *
 * @param options - Configuration options
 * @throws PromptError if initialization fails
 */
export declare function initializePromptLoader(options?: PromptLoaderOptions): void;

/**
 * Loads a prompt by name from the filesystem.
 * Attempts user prompt first, falls back to default if not found.
 *
 * @param name - Prompt identifier (e.g., 'page-analysis')
 * @returns Promise resolving to the loaded SystemPrompt
 * @throws PromptError if prompt cannot be loaded
 *
 * @example
 * const prompt = await loadPrompt('page-analysis');
 * console.log(prompt.name); // 'page-analysis'
 */
export declare function loadPrompt(name: string): Promise<SystemPrompt>;

/**
 * Renders a prompt template with the provided context variables.
 *
 * @param prompt - The loaded SystemPrompt to render
 * @param context - Variables and options for rendering
 * @returns The rendered prompt result
 * @throws PromptError if required variables are missing
 *
 * @example
 * const result = renderPrompt(prompt, {
 *   variables: { url: 'https://example.com', title: 'Example' }
 * });
 * console.log(result.renderedContent);
 */
export declare function renderPrompt(
  prompt: SystemPrompt,
  context: PromptContext
): PromptRenderResult;

/**
 * Convenience function: loads and renders a prompt in one call.
 *
 * @param name - Prompt identifier
 * @param context - Variables and options for rendering
 * @returns Promise resolving to the rendered prompt result
 *
 * @example
 * const result = await loadAndRenderPrompt('page-analysis', {
 *   variables: { url: 'https://example.com' }
 * });
 */
export declare function loadAndRenderPrompt(
  name: string,
  context: PromptContext
): Promise<PromptRenderResult>;

/**
 * Lists all available prompt names.
 * Returns both user and default prompts, with user prompts taking precedence.
 *
 * @returns Promise resolving to array of prompt names
 *
 * @example
 * const prompts = await listPrompts();
 * // ['page-analysis', 'test-scenario-generation', 'test-data-generation']
 */
export declare function listPrompts(): Promise<string[]>;

/**
 * Checks if a prompt exists (either user or default).
 *
 * @param name - Prompt identifier to check
 * @returns Promise resolving to true if prompt exists
 */
export declare function promptExists(name: string): Promise<boolean>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates a prompt file without loading it into the registry.
 * Useful for validating user edits before running commands.
 *
 * @param filePath - Path to the prompt file to validate
 * @returns Promise resolving to validation result
 *
 * @example
 * const result = await validatePromptFile('./prompts/page-analysis.md');
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
export declare function validatePromptFile(filePath: string): Promise<{
  valid: boolean;
  errors: PromptError[];
  warnings: string[];
}>;

/**
 * Validates a context against a prompt's variable requirements.
 *
 * @param prompt - The SystemPrompt to validate against
 * @param context - The context to validate
 * @returns Validation result with any missing required variables
 */
export declare function validateContext(
  prompt: SystemPrompt,
  context: PromptContext
): {
  valid: boolean;
  missingRequired: string[];
  unusedProvided: string[];
};

// ============================================================================
// Reset Functions
// ============================================================================

/**
 * Resets a single prompt to its default version.
 * Copies from defaults/ to the user prompts directory.
 *
 * @param name - Prompt identifier to reset
 * @param options - Reset options
 * @returns Promise resolving when reset is complete
 * @throws PromptError if default prompt doesn't exist
 *
 * @example
 * await resetPrompt('page-analysis', { force: true });
 */
export declare function resetPrompt(
  name: string,
  options?: { force?: boolean }
): Promise<void>;

/**
 * Resets all prompts to their default versions.
 *
 * @param options - Reset options
 * @returns Promise resolving to array of reset prompt names
 *
 * @example
 * const reset = await resetAllPrompts({ force: true });
 * console.log(`Reset ${reset.length} prompts`);
 */
export declare function resetAllPrompts(
  options?: { force?: boolean }
): Promise<string[]>;

/**
 * Gets the paths for a prompt (user and default).
 * Useful for debugging and CLI output.
 *
 * @param name - Prompt identifier
 * @returns Object with user and default paths
 */
export declare function getPromptPaths(name: string): {
  userPath: string;
  defaultPath: string;
};

// ============================================================================
// Registry Functions
// ============================================================================

/**
 * Clears the in-memory prompt cache.
 * Forces prompts to be reloaded from disk on next access.
 *
 * @example
 * clearPromptCache();
 * // Next loadPrompt() call will read from disk
 */
export declare function clearPromptCache(): void;

/**
 * Gets the current prompt loader configuration.
 * Returns undefined if not initialized.
 */
export declare function getPromptLoaderConfig(): PromptLoaderOptions | undefined;

// ============================================================================
// Error Helpers
// ============================================================================

/**
 * Creates a typed PromptError with suggestions.
 *
 * @param type - Error type
 * @param message - Human-readable message
 * @param options - Additional error options
 */
export declare function createPromptError(
  type: PromptErrorType,
  message: string,
  options: {
    filePath: string;
    field?: string;
    suggestions?: string[];
    cause?: Error;
  }
): PromptError;

/**
 * Type guard for PromptError.
 */
export declare function isPromptError(error: unknown): error is PromptError;
