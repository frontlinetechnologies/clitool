/**
 * Error handling for documentation generation.
 * Provides structured error types and error class for documentation-specific errors.
 */

export enum DocumentationErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class DocumentationError extends Error {
  constructor(
    public readonly type: DocumentationErrorType,
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'DocumentationError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocumentationError);
    }
  }

  /**
   * Creates a user-friendly error message with actionable guidance.
   */
  toUserMessage(): string {
    switch (this.type) {
      case DocumentationErrorType.INVALID_INPUT:
        return `Invalid input: ${this.message}. Please provide valid crawl results JSON.`;
      case DocumentationErrorType.PARSE_ERROR:
        return `Parse error: ${this.message}. The input JSON could not be parsed.`;
      case DocumentationErrorType.VALIDATION_ERROR:
        return `Validation error: ${this.message}. The crawl results do not match the expected schema.`;
      case DocumentationErrorType.FILE_WRITE_ERROR:
        return `File write error: ${this.message}. Could not write documentation to file.`;
      case DocumentationErrorType.GENERATION_ERROR:
        return `Generation error: ${this.message}. Documentation generation failed.`;
      default:
        return `Error: ${this.message}`;
    }
  }
}

/**
 * Creates a documentation error with appropriate type and message.
 */
export function createDocumentationError(
  type: DocumentationErrorType,
  message: string,
  cause?: Error,
): DocumentationError {
  return new DocumentationError(type, message, cause);
}

