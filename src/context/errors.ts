/**
 * Error types for the context loading module.
 * Feature: 007-ai-context-option
 */

/**
 * Error codes for context loading operations.
 */
export type ContextErrorCode =
  | 'FILE_NOT_FOUND'
  | 'FILE_NOT_READABLE'
  | 'INVALID_ENCODING'
  | 'SIZE_EXCEEDED'
  | 'INVALID_PATH'
  | 'INVALID_FILE_TYPE'
  | 'PERMISSION_DENIED'
  | 'IS_DIRECTORY';

/**
 * Error thrown when context loading fails.
 */
export class ContextError extends Error {
  readonly name = 'ContextError';

  constructor(
    public readonly code: ContextErrorCode,
    message: string,
    public readonly filePath?: string,
    public readonly suggestion?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, ContextError.prototype);
  }

  /**
   * Returns a user-friendly error message including suggestion if available.
   */
  toUserMessage(): string {
    let message = this.message;
    if (this.suggestion) {
      message += `\n${this.suggestion}`;
    }
    return message;
  }
}

/**
 * Creates a ContextError for file not found scenario.
 */
export function createFileNotFoundError(filePath: string): ContextError {
  return new ContextError(
    'FILE_NOT_FOUND',
    `Context file not found: ${filePath}`,
    filePath,
    'Run with an existing .md or .txt file.'
  );
}

/**
 * Creates a ContextError for file not readable scenario.
 */
export function createFileNotReadableError(filePath: string): ContextError {
  return new ContextError(
    'FILE_NOT_READABLE',
    `Cannot read context file: ${filePath}`,
    filePath,
    'Check file permissions.'
  );
}

/**
 * Creates a ContextError for invalid encoding scenario.
 */
export function createInvalidEncodingError(filePath: string): ContextError {
  return new ContextError(
    'INVALID_ENCODING',
    `Context file contains invalid characters: ${filePath}`,
    filePath,
    'Ensure the file is saved as UTF-8.'
  );
}

/**
 * Creates a ContextError for size exceeded scenario.
 */
export function createSizeExceededError(filePath: string, sizeKB: number): ContextError {
  return new ContextError(
    'SIZE_EXCEEDED',
    `Context file exceeds 100KB limit (${sizeKB}KB).`,
    filePath,
    'Try summarizing or splitting the content.'
  );
}

/**
 * Creates a ContextError for invalid path (path traversal) scenario.
 */
export function createInvalidPathError(filePath: string): ContextError {
  return new ContextError(
    'INVALID_PATH',
    `Context file must be within current directory: ${filePath}`,
    filePath,
    'Use a relative path within your project.'
  );
}

/**
 * Creates a ContextError for invalid file type scenario.
 */
export function createInvalidFileTypeError(filePath: string): ContextError {
  return new ContextError(
    'INVALID_FILE_TYPE',
    `Context file must be .md or .txt: ${filePath}`,
    filePath,
    'Use a markdown (.md) or text (.txt) file.'
  );
}

/**
 * Creates a ContextError for permission denied scenario.
 */
export function createPermissionDeniedError(filePath: string): ContextError {
  return new ContextError(
    'PERMISSION_DENIED',
    `Permission denied reading context file: ${filePath}`,
    filePath,
    'Check file permissions.'
  );
}

/**
 * Creates a ContextError for is-directory scenario.
 */
export function createIsDirectoryError(filePath: string): ContextError {
  return new ContextError(
    'IS_DIRECTORY',
    `Path is a directory, not a file: ${filePath}`,
    filePath,
    'Provide a path to a .md or .txt file.'
  );
}

/**
 * Type guard to check if an error is a ContextError.
 */
export function isContextError(error: unknown): error is ContextError {
  return error instanceof Error && error.name === 'ContextError';
}
