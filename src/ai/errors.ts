/**
 * AI-specific error handling infrastructure.
 * Provides typed errors for Anthropic API failures with user-friendly messages.
 */

/**
 * Types of AI-related errors.
 */
export enum AIErrorType {
  /** Invalid or expired API key */
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  /** API rate limit exceeded */
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  /** API key format is invalid (doesn't start with sk-ant-) */
  INVALID_KEY_FORMAT = 'INVALID_KEY_FORMAT',
  /** Network or connection failure */
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  /** Generic API error */
  API_ERROR = 'API_ERROR',
}

/**
 * User-friendly messages for each error type.
 */
const ERROR_MESSAGES: Record<AIErrorType, { message: string; suggestion: string }> = {
  [AIErrorType.AUTHENTICATION_ERROR]: {
    message: 'API authentication failed',
    suggestion: 'Please check that your API key is valid and not expired. You can get a new key at https://console.anthropic.com/',
  },
  [AIErrorType.RATE_LIMIT_ERROR]: {
    message: 'API rate limit exceeded',
    suggestion: 'Wait a few minutes before retrying. Consider reducing the crawl rate with --rate-limit option.',
  },
  [AIErrorType.INVALID_KEY_FORMAT]: {
    message: 'API key format is invalid',
    suggestion: 'Anthropic API keys should start with "sk-ant-". Please check your key configuration.',
  },
  [AIErrorType.CONNECTION_ERROR]: {
    message: 'Failed to connect to Anthropic API',
    suggestion: 'Check your internet connection and try again. The API service may also be temporarily unavailable.',
  },
  [AIErrorType.API_ERROR]: {
    message: 'Anthropic API request failed',
    suggestion: 'This may be a temporary issue. Try again later or check https://status.anthropic.com/ for service status.',
  },
};

/**
 * AI-specific error class with user-friendly messaging.
 */
export class AIError extends Error {
  public readonly type: AIErrorType;
  public readonly originalError?: Error;

  constructor(type: AIErrorType, originalError?: Error) {
    const errorInfo = ERROR_MESSAGES[type];
    super(errorInfo.message);
    this.name = 'AIError';
    this.type = type;
    this.originalError = originalError;
  }

  /**
   * Returns a user-friendly error message with actionable suggestions.
   */
  toUserMessage(): string {
    const errorInfo = ERROR_MESSAGES[this.type];
    let message = `AI Error: ${errorInfo.message}`;
    message += `\n${errorInfo.suggestion}`;

    if (this.originalError && this.originalError.message !== errorInfo.message) {
      message += `\n\nDetails: ${this.originalError.message}`;
    }

    return message;
  }
}

/**
 * Creates an AIError from an unknown error.
 * Attempts to classify the error based on common patterns.
 */
export function createAIError(error: unknown): AIError {
  if (error instanceof AIError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const originalError = error instanceof Error ? error : undefined;

  // Check for authentication errors
  if (errorMessage.includes('authentication') ||
      errorMessage.includes('invalid_api_key') ||
      errorMessage.includes('401')) {
    return new AIError(AIErrorType.AUTHENTICATION_ERROR, originalError);
  }

  // Check for rate limit errors
  if (errorMessage.includes('rate_limit') ||
      errorMessage.includes('429') ||
      errorMessage.includes('too many requests')) {
    return new AIError(AIErrorType.RATE_LIMIT_ERROR, originalError);
  }

  // Check for connection errors
  if (errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('network')) {
    return new AIError(AIErrorType.CONNECTION_ERROR, originalError);
  }

  // Default to generic API error
  return new AIError(AIErrorType.API_ERROR, originalError);
}

/**
 * Type guard to check if an error is an AIError.
 */
export function isAIError(error: unknown): error is AIError {
  return error instanceof AIError;
}
