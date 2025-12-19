import {
  ContextError,
  createFileNotFoundError,
  createFileNotReadableError,
  createInvalidEncodingError,
  createSizeExceededError,
  createInvalidPathError,
  createInvalidFileTypeError,
  createPermissionDeniedError,
  createIsDirectoryError,
  isContextError,
} from '../../../src/context/errors';

describe('ContextError', () => {
  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new ContextError(
        'FILE_NOT_FOUND',
        'File not found',
        '/path/to/file.md',
        'Check the file path.'
      );

      expect(error.name).toBe('ContextError');
      expect(error.code).toBe('FILE_NOT_FOUND');
      expect(error.message).toBe('File not found');
      expect(error.filePath).toBe('/path/to/file.md');
      expect(error.suggestion).toBe('Check the file path.');
    });

    it('should create error without optional properties', () => {
      const error = new ContextError('SIZE_EXCEEDED', 'Too large');

      expect(error.code).toBe('SIZE_EXCEEDED');
      expect(error.message).toBe('Too large');
      expect(error.filePath).toBeUndefined();
      expect(error.suggestion).toBeUndefined();
    });
  });

  describe('toUserMessage', () => {
    it('should return message with suggestion', () => {
      const error = new ContextError(
        'FILE_NOT_FOUND',
        'Context file not found: test.md',
        'test.md',
        'Run with an existing .md or .txt file.'
      );

      expect(error.toUserMessage()).toBe(
        'Context file not found: test.md\nRun with an existing .md or .txt file.'
      );
    });

    it('should return message without suggestion', () => {
      const error = new ContextError('SIZE_EXCEEDED', 'File too large');

      expect(error.toUserMessage()).toBe('File too large');
    });
  });
});

describe('Error factory functions', () => {
  describe('createFileNotFoundError', () => {
    it('should create FILE_NOT_FOUND error', () => {
      const error = createFileNotFoundError('/path/to/missing.md');

      expect(error.code).toBe('FILE_NOT_FOUND');
      expect(error.message).toContain('missing.md');
      expect(error.filePath).toBe('/path/to/missing.md');
      expect(error.suggestion).toContain('.md or .txt');
    });
  });

  describe('createFileNotReadableError', () => {
    it('should create FILE_NOT_READABLE error', () => {
      const error = createFileNotReadableError('/path/to/file.md');

      expect(error.code).toBe('FILE_NOT_READABLE');
      expect(error.message).toContain('Cannot read');
      expect(error.suggestion).toContain('permissions');
    });
  });

  describe('createInvalidEncodingError', () => {
    it('should create INVALID_ENCODING error', () => {
      const error = createInvalidEncodingError('/path/to/binary.bin');

      expect(error.code).toBe('INVALID_ENCODING');
      expect(error.message).toContain('invalid characters');
      expect(error.suggestion).toContain('UTF-8');
    });
  });

  describe('createSizeExceededError', () => {
    it('should create SIZE_EXCEEDED error with size info', () => {
      const error = createSizeExceededError('/path/to/large.md', 150);

      expect(error.code).toBe('SIZE_EXCEEDED');
      expect(error.message).toContain('150KB');
      expect(error.message).toContain('100KB');
      expect(error.suggestion).toContain('summarizing');
    });
  });

  describe('createInvalidPathError', () => {
    it('should create INVALID_PATH error', () => {
      const error = createInvalidPathError('../../../etc/passwd');

      expect(error.code).toBe('INVALID_PATH');
      expect(error.message).toContain('within current directory');
      expect(error.suggestion).toContain('relative path');
    });
  });

  describe('createInvalidFileTypeError', () => {
    it('should create INVALID_FILE_TYPE error', () => {
      const error = createInvalidFileTypeError('/path/to/file.json');

      expect(error.code).toBe('INVALID_FILE_TYPE');
      expect(error.message).toContain('.md or .txt');
      expect(error.suggestion).toContain('markdown');
    });
  });

  describe('createPermissionDeniedError', () => {
    it('should create PERMISSION_DENIED error', () => {
      const error = createPermissionDeniedError('/restricted/file.md');

      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.message).toContain('Permission denied');
      expect(error.suggestion).toContain('permissions');
    });
  });

  describe('createIsDirectoryError', () => {
    it('should create IS_DIRECTORY error', () => {
      const error = createIsDirectoryError('/path/to/directory');

      expect(error.code).toBe('IS_DIRECTORY');
      expect(error.message).toContain('directory');
      expect(error.suggestion).toContain('path to a .md or .txt file');
    });
  });
});

describe('isContextError', () => {
  it('should return true for ContextError instances', () => {
    const error = new ContextError('FILE_NOT_FOUND', 'Not found');
    expect(isContextError(error)).toBe(true);
  });

  it('should return true for factory-created errors', () => {
    const error = createFileNotFoundError('/test.md');
    expect(isContextError(error)).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error('Regular error');
    expect(isContextError(error)).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isContextError(null)).toBe(false);
    expect(isContextError(undefined)).toBe(false);
    expect(isContextError('error string')).toBe(false);
    expect(isContextError({ message: 'object' })).toBe(false);
  });
});
