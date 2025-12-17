/**
 * Unit tests for AI error handling infrastructure.
 */

import {
  AIError,
  AIErrorType,
  createAIError,
  isAIError,
} from '../../../src/ai/errors';

describe('AIError', () => {
  describe('constructor', () => {
    it('should create an error with the correct type', () => {
      const error = new AIError(AIErrorType.AUTHENTICATION_ERROR);
      expect(error.type).toBe(AIErrorType.AUTHENTICATION_ERROR);
      expect(error.name).toBe('AIError');
    });

    it('should store the original error if provided', () => {
      const originalError = new Error('Original error');
      const error = new AIError(AIErrorType.RATE_LIMIT_ERROR, originalError);
      expect(error.originalError).toBe(originalError);
    });

    it('should have a meaningful message', () => {
      const error = new AIError(AIErrorType.INVALID_KEY_FORMAT);
      expect(error.message).toContain('invalid');
    });
  });

  describe('toUserMessage', () => {
    it('should return user-friendly message for AUTHENTICATION_ERROR', () => {
      const error = new AIError(AIErrorType.AUTHENTICATION_ERROR);
      const message = error.toUserMessage();
      expect(message).toContain('AI Error');
      expect(message).toContain('authentication');
      expect(message).toContain('API key');
    });

    it('should return user-friendly message for RATE_LIMIT_ERROR', () => {
      const error = new AIError(AIErrorType.RATE_LIMIT_ERROR);
      const message = error.toUserMessage();
      expect(message).toContain('rate limit');
      expect(message).toContain('Wait');
    });

    it('should return user-friendly message for INVALID_KEY_FORMAT', () => {
      const error = new AIError(AIErrorType.INVALID_KEY_FORMAT);
      const message = error.toUserMessage();
      expect(message).toContain('format');
      expect(message).toContain('sk-ant-');
    });

    it('should return user-friendly message for CONNECTION_ERROR', () => {
      const error = new AIError(AIErrorType.CONNECTION_ERROR);
      const message = error.toUserMessage();
      expect(message).toContain('connect');
      expect(message).toContain('internet');
    });

    it('should return user-friendly message for API_ERROR', () => {
      const error = new AIError(AIErrorType.API_ERROR);
      const message = error.toUserMessage();
      expect(message).toContain('API');
      expect(message).toContain('request');
    });

    it('should include original error details if available', () => {
      const originalError = new Error('Specific API failure details');
      const error = new AIError(AIErrorType.API_ERROR, originalError);
      const message = error.toUserMessage();
      expect(message).toContain('Specific API failure details');
    });
  });
});

describe('createAIError', () => {
  it('should return the same AIError if already an AIError', () => {
    const originalError = new AIError(AIErrorType.AUTHENTICATION_ERROR);
    const result = createAIError(originalError);
    expect(result).toBe(originalError);
  });

  it('should detect authentication errors', () => {
    const error = new Error('authentication failed');
    const result = createAIError(error);
    expect(result.type).toBe(AIErrorType.AUTHENTICATION_ERROR);
  });

  it('should detect 401 errors as authentication errors', () => {
    const error = new Error('Request failed with status 401');
    const result = createAIError(error);
    expect(result.type).toBe(AIErrorType.AUTHENTICATION_ERROR);
  });

  it('should detect rate limit errors', () => {
    const error = new Error('rate_limit_exceeded');
    const result = createAIError(error);
    expect(result.type).toBe(AIErrorType.RATE_LIMIT_ERROR);
  });

  it('should detect 429 errors as rate limit errors', () => {
    const error = new Error('Request failed with status 429');
    const result = createAIError(error);
    expect(result.type).toBe(AIErrorType.RATE_LIMIT_ERROR);
  });

  it('should detect connection errors', () => {
    const error = new Error('ENOTFOUND api.anthropic.com');
    const result = createAIError(error);
    expect(result.type).toBe(AIErrorType.CONNECTION_ERROR);
  });

  it('should detect ECONNREFUSED as connection error', () => {
    const error = new Error('ECONNREFUSED');
    const result = createAIError(error);
    expect(result.type).toBe(AIErrorType.CONNECTION_ERROR);
  });

  it('should detect ETIMEDOUT as connection error', () => {
    const error = new Error('ETIMEDOUT');
    const result = createAIError(error);
    expect(result.type).toBe(AIErrorType.CONNECTION_ERROR);
  });

  it('should default to API_ERROR for unknown errors', () => {
    const error = new Error('Some unknown error');
    const result = createAIError(error);
    expect(result.type).toBe(AIErrorType.API_ERROR);
  });

  it('should handle string errors', () => {
    const result = createAIError('string error');
    expect(result).toBeInstanceOf(AIError);
    expect(result.type).toBe(AIErrorType.API_ERROR);
  });

  it('should handle undefined errors', () => {
    const result = createAIError(undefined);
    expect(result).toBeInstanceOf(AIError);
    expect(result.type).toBe(AIErrorType.API_ERROR);
  });
});

describe('isAIError', () => {
  it('should return true for AIError instances', () => {
    const error = new AIError(AIErrorType.API_ERROR);
    expect(isAIError(error)).toBe(true);
  });

  it('should return false for regular Error instances', () => {
    const error = new Error('Regular error');
    expect(isAIError(error)).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isAIError('string')).toBe(false);
    expect(isAIError(123)).toBe(false);
    expect(isAIError(null)).toBe(false);
    expect(isAIError(undefined)).toBe(false);
    expect(isAIError({})).toBe(false);
  });
});
