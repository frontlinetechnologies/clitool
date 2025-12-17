/**
 * Error types and factory for the prompt management module.
 * Feature: 001-ai-system-prompts
 */

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
 * Creates a typed PromptError with suggestions.
 *
 * @param type - Error type
 * @param message - Human-readable message
 * @param options - Additional error options
 */
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

/**
 * Type guard for PromptError.
 */
export function isPromptError(error: unknown): error is PromptError {
  return error instanceof Error && error.name === 'PromptError';
}
