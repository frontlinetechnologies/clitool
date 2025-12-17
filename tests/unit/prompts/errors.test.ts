/**
 * Tests for prompt error handling.
 * Feature: 001-ai-system-prompts
 */

import {
  PromptErrorType,
  createPromptError,
  isPromptError,
} from '../../../src/prompts/errors';

describe('errors', () => {
  describe('createPromptError', () => {
    it('creates error with required fields', () => {
      const error = createPromptError(
        PromptErrorType.FILE_NOT_FOUND,
        'File not found',
        { filePath: '/path/to/file.md' }
      );

      expect(error.name).toBe('PromptError');
      expect(error.type).toBe(PromptErrorType.FILE_NOT_FOUND);
      expect(error.message).toBe('File not found');
      expect(error.filePath).toBe('/path/to/file.md');
      expect(error.suggestions).toEqual([]);
    });

    it('includes optional field', () => {
      const error = createPromptError(
        PromptErrorType.MISSING_REQUIRED_FIELD,
        'Missing field',
        { filePath: '/path/to/file.md', field: 'name' }
      );

      expect(error.field).toBe('name');
    });

    it('includes suggestions', () => {
      const error = createPromptError(
        PromptErrorType.INVALID_FRONTMATTER,
        'Invalid frontmatter',
        {
          filePath: '/path/to/file.md',
          suggestions: ['Add frontmatter section', 'Use YAML format'],
        }
      );

      expect(error.suggestions).toEqual([
        'Add frontmatter section',
        'Use YAML format',
      ]);
    });

    it('includes cause error', () => {
      const cause = new Error('Original error');
      const error = createPromptError(
        PromptErrorType.PARSE_ERROR,
        'Parse failed',
        { filePath: '/path/to/file.md', cause }
      );

      expect(error.cause).toBe(cause);
    });

    it('creates errors with all types', () => {
      const types = Object.values(PromptErrorType);

      for (const type of types) {
        const error = createPromptError(type, `Error: ${type}`, {
          filePath: '/test.md',
        });
        expect(error.type).toBe(type);
      }
    });
  });

  describe('isPromptError', () => {
    it('returns true for PromptError', () => {
      const error = createPromptError(
        PromptErrorType.FILE_NOT_FOUND,
        'Test error',
        { filePath: '/test.md' }
      );

      expect(isPromptError(error)).toBe(true);
    });

    it('returns false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isPromptError(error)).toBe(false);
    });

    it('returns false for non-Error objects', () => {
      expect(isPromptError({ message: 'fake error' })).toBe(false);
      expect(isPromptError(null)).toBe(false);
      expect(isPromptError(undefined)).toBe(false);
      expect(isPromptError('error string')).toBe(false);
    });
  });
});
