/**
 * Error handling for test generation.
 * Provides structured error types and error class for test generation-specific errors.
 */

export enum TestGenerationErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  AI_ERROR = 'AI_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class TestGenerationError extends Error {
  constructor(
    public readonly type: TestGenerationErrorType,
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'TestGenerationError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TestGenerationError);
    }
  }

  /**
   * Creates a user-friendly error message with actionable guidance.
   */
  toUserMessage(): string {
    switch (this.type) {
      case TestGenerationErrorType.INVALID_INPUT:
        return `Invalid input: ${this.message}. Please provide valid crawl results JSON.`;
      case TestGenerationErrorType.PARSE_ERROR:
        return `Parse error: ${this.message}. The input JSON could not be parsed.`;
      case TestGenerationErrorType.VALIDATION_ERROR:
        return `Validation error: ${this.message}. The crawl results do not match the expected schema.`;
      case TestGenerationErrorType.FILE_WRITE_ERROR:
        return `File write error: ${this.message}. Could not write test files to directory.`;
      case TestGenerationErrorType.GENERATION_ERROR:
        return `Generation error: ${this.message}. Test generation failed.`;
      case TestGenerationErrorType.AI_ERROR:
        return `AI error: ${this.message}. AI enhancement unavailable, using pattern-based generation.`;
      default:
        return `Error: ${this.message}`;
    }
  }
}

/**
 * Creates a test generation error with appropriate type and message.
 */
export function createTestGenerationError(
  type: TestGenerationErrorType,
  message: string,
  cause?: Error,
): TestGenerationError {
  return new TestGenerationError(type, message, cause);
}

