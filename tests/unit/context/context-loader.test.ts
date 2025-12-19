import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadContextFromFile, loadContext } from '../../../src/context/context-loader';
import { ContextError } from '../../../src/context/errors';
import {
  CONTEXT_SIZE_MAX,
  CONTEXT_ENV_VAR,
  CONTEXT_SIZE_WARNING_THRESHOLD,
} from '../../../src/context/types';

describe('loadContextFromFile', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'context-loader-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('valid files', () => {
    it('should load valid .md file', () => {
      const filePath = path.join(tempDir, 'context.md');
      fs.writeFileSync(filePath, '# Context\n\nThis is context content.');

      const result = loadContextFromFile('context.md');

      expect(result.type).toBe('file');
      expect(result.content).toBe('# Context\n\nThis is context content.');
      expect(result.reference).toBe('context.md');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should load valid .txt file', () => {
      const filePath = path.join(tempDir, 'context.txt');
      fs.writeFileSync(filePath, 'Plain text context');

      const result = loadContextFromFile('context.txt');

      expect(result.type).toBe('file');
      expect(result.content).toBe('Plain text context');
    });

    it('should handle empty file', () => {
      const filePath = path.join(tempDir, 'empty.md');
      fs.writeFileSync(filePath, '');

      const result = loadContextFromFile('empty.md');

      expect(result.content).toBe('');
      expect(result.size).toBe(0);
    });

    it('should handle file with unicode content', () => {
      const filePath = path.join(tempDir, 'unicode.md');
      const content = 'Unicode content: ';
      fs.writeFileSync(filePath, content);

      const result = loadContextFromFile('unicode.md');

      expect(result.content).toBe(content);
    });

    it('should handle file in subdirectory', () => {
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir);
      const filePath = path.join(subDir, 'nested.md');
      fs.writeFileSync(filePath, 'Nested content');

      const result = loadContextFromFile('subdir/nested.md');

      expect(result.content).toBe('Nested content');
    });
  });

  describe('FILE_NOT_FOUND error', () => {
    it('should throw for missing file', () => {
      expect(() => loadContextFromFile('nonexistent.md')).toThrow(ContextError);
      expect(() => loadContextFromFile('nonexistent.md')).toThrow(/not found/);

      try {
        loadContextFromFile('nonexistent.md');
      } catch (error) {
        expect((error as ContextError).code).toBe('FILE_NOT_FOUND');
      }
    });
  });

  describe('INVALID_FILE_TYPE error', () => {
    it('should reject .json files', () => {
      const filePath = path.join(tempDir, 'data.json');
      fs.writeFileSync(filePath, '{}');

      expect(() => loadContextFromFile('data.json')).toThrow(ContextError);

      try {
        loadContextFromFile('data.json');
      } catch (error) {
        expect((error as ContextError).code).toBe('INVALID_FILE_TYPE');
      }
    });

    it('should reject files without extension', () => {
      const filePath = path.join(tempDir, 'noext');
      fs.writeFileSync(filePath, 'content');

      expect(() => loadContextFromFile('noext')).toThrow(ContextError);

      try {
        loadContextFromFile('noext');
      } catch (error) {
        expect((error as ContextError).code).toBe('INVALID_FILE_TYPE');
      }
    });

    it('should reject .js files', () => {
      const filePath = path.join(tempDir, 'script.js');
      fs.writeFileSync(filePath, 'console.log("test")');

      expect(() => loadContextFromFile('script.js')).toThrow(ContextError);
    });

    it('should accept .MD uppercase extension', () => {
      const filePath = path.join(tempDir, 'CONTEXT.MD');
      fs.writeFileSync(filePath, 'Content');

      const result = loadContextFromFile('CONTEXT.MD');
      expect(result.content).toBe('Content');
    });

    it('should accept .TXT uppercase extension', () => {
      const filePath = path.join(tempDir, 'CONTEXT.TXT');
      fs.writeFileSync(filePath, 'Content');

      const result = loadContextFromFile('CONTEXT.TXT');
      expect(result.content).toBe('Content');
    });
  });

  describe('INVALID_PATH error (security: path traversal)', () => {
    it('should reject path traversal with ../', () => {
      expect(() => loadContextFromFile('../outside.md')).toThrow(ContextError);

      try {
        loadContextFromFile('../outside.md');
      } catch (error) {
        expect((error as ContextError).code).toBe('INVALID_PATH');
      }
    });

    it('should reject deep path traversal', () => {
      expect(() => loadContextFromFile('../../etc/passwd')).toThrow(ContextError);

      try {
        loadContextFromFile('../../etc/passwd');
      } catch (error) {
        expect((error as ContextError).code).toBe('INVALID_PATH');
      }
    });

    it('should reject hidden path traversal', () => {
      expect(() => loadContextFromFile('subdir/../../../etc/hosts')).toThrow(ContextError);
    });

    it('should reject absolute paths outside cwd', () => {
      expect(() => loadContextFromFile('/etc/passwd')).toThrow(ContextError);

      try {
        loadContextFromFile('/etc/passwd');
      } catch (error) {
        expect((error as ContextError).code).toBe('INVALID_PATH');
      }
    });

    it('should allow relative paths within cwd', () => {
      const filePath = path.join(tempDir, 'allowed.md');
      fs.writeFileSync(filePath, 'Content');

      // Use relative path (cwd is tempDir)
      const result = loadContextFromFile('allowed.md');
      expect(result.content).toBe('Content');
    });
  });

  describe('SIZE_EXCEEDED error', () => {
    it('should reject files over 100KB', () => {
      const filePath = path.join(tempDir, 'large.md');
      const largeContent = 'x'.repeat(CONTEXT_SIZE_MAX + 1);
      fs.writeFileSync(filePath, largeContent);

      expect(() => loadContextFromFile('large.md')).toThrow(ContextError);

      try {
        loadContextFromFile('large.md');
      } catch (error) {
        expect((error as ContextError).code).toBe('SIZE_EXCEEDED');
      }
    });

    it('should accept files at exactly 100KB', () => {
      const filePath = path.join(tempDir, 'exactly.md');
      const content = 'x'.repeat(CONTEXT_SIZE_MAX);
      fs.writeFileSync(filePath, content);

      const result = loadContextFromFile('exactly.md');
      expect(result.size).toBe(CONTEXT_SIZE_MAX);
    });
  });

  describe('INVALID_ENCODING error', () => {
    it('should reject binary files', () => {
      const filePath = path.join(tempDir, 'binary.md');
      // Create buffer with invalid UTF-8 sequence
      const buffer = Buffer.from([0xff, 0xfe, 0x00, 0x01]);
      fs.writeFileSync(filePath, buffer);

      expect(() => loadContextFromFile('binary.md')).toThrow(ContextError);

      try {
        loadContextFromFile('binary.md');
      } catch (error) {
        expect((error as ContextError).code).toBe('INVALID_ENCODING');
      }
    });
  });

  describe('IS_DIRECTORY error', () => {
    it('should reject directory paths', () => {
      // Note: This would fail at file type check first, but test with .md extension
      const dirPath = path.join(tempDir, 'fakedir.md');
      fs.mkdirSync(dirPath);

      expect(() => loadContextFromFile('fakedir.md')).toThrow(ContextError);

      try {
        loadContextFromFile('fakedir.md');
      } catch (error) {
        expect((error as ContextError).code).toBe('IS_DIRECTORY');
      }
    });
  });
});

describe('loadContext', () => {
  let tempDir: string;
  let originalCwd: string;
  let originalEnv: string | undefined;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'context-load-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    originalEnv = process.env[CONTEXT_ENV_VAR];
    delete process.env[CONTEXT_ENV_VAR];
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (originalEnv !== undefined) {
      process.env[CONTEXT_ENV_VAR] = originalEnv;
    } else {
      delete process.env[CONTEXT_ENV_VAR];
    }
  });

  describe('no sources', () => {
    it('should return null when no sources provided', () => {
      const result = loadContext({});

      expect(result.context).toBeNull();
      expect(result.warnings).toEqual([]);
    });

    it('should return null for undefined options', () => {
      const result = loadContext({ context: undefined, contextText: undefined });

      expect(result.context).toBeNull();
    });
  });

  describe('file source only', () => {
    it('should load file source only', () => {
      const filePath = path.join(tempDir, 'context.md');
      fs.writeFileSync(filePath, 'File content');

      const result = loadContext({ context: 'context.md' });

      expect(result.context).not.toBeNull();
      expect(result.context!.content).toContain('File content');
      expect(result.context!.sources).toHaveLength(1);
      expect(result.context!.sources[0].type).toBe('file');
    });
  });

  describe('inline source only', () => {
    it('should load inline source only', () => {
      const result = loadContext({ contextText: 'Inline context' });

      expect(result.context).not.toBeNull();
      expect(result.context!.content).toContain('Inline context');
      expect(result.context!.sources).toHaveLength(1);
      expect(result.context!.sources[0].type).toBe('inline');
    });
  });

  describe('environment source only', () => {
    it('should load environment source only', () => {
      process.env[CONTEXT_ENV_VAR] = 'Environment context';

      const result = loadContext({});

      expect(result.context).not.toBeNull();
      expect(result.context!.content).toContain('Environment context');
      expect(result.context!.sources).toHaveLength(1);
      expect(result.context!.sources[0].type).toBe('environment');
    });
  });

  describe('multiple sources', () => {
    it('should merge all three sources in correct order', () => {
      const filePath = path.join(tempDir, 'context.md');
      fs.writeFileSync(filePath, 'File content');
      process.env[CONTEXT_ENV_VAR] = 'Environment content';

      const result = loadContext({
        context: 'context.md',
        contextText: 'Inline content',
      });

      expect(result.context).not.toBeNull();
      expect(result.context!.sources).toHaveLength(3);
      expect(result.context!.sources[0].type).toBe('file');
      expect(result.context!.sources[1].type).toBe('inline');
      expect(result.context!.sources[2].type).toBe('environment');

      // Verify order in output
      const content = result.context!.content;
      const filePos = content.indexOf('File content');
      const inlinePos = content.indexOf('Inline content');
      const envPos = content.indexOf('Environment content');

      expect(filePos).toBeLessThan(inlinePos);
      expect(inlinePos).toBeLessThan(envPos);
    });
  });

  describe('empty inline text filtering', () => {
    it('should filter empty inline text', () => {
      const result = loadContext({ contextText: '' });

      expect(result.context).toBeNull();
    });

    it('should filter whitespace-only inline text', () => {
      const result = loadContext({ contextText: '   \n\t  ' });

      expect(result.context).toBeNull();
    });

    it('should not filter non-empty inline text', () => {
      const result = loadContext({ contextText: '  actual content  ' });

      expect(result.context).not.toBeNull();
      expect(result.context!.content).toContain('actual content');
    });
  });

  describe('size warnings', () => {
    it('should add warning when >50KB', () => {
      const filePath = path.join(tempDir, 'large.md');
      const content = 'x'.repeat(CONTEXT_SIZE_WARNING_THRESHOLD + 1);
      fs.writeFileSync(filePath, content);

      const result = loadContext({ context: 'large.md' });

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Warning');
      expect(result.warnings[0]).toContain('50KB');
      expect(result.warnings[0]).toContain('100KB');
    });

    it('should not warn below threshold', () => {
      const filePath = path.join(tempDir, 'small.md');
      const content = 'x'.repeat(1000);
      fs.writeFileSync(filePath, content);

      const result = loadContext({ context: 'small.md' });

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('combined size exceeds max', () => {
    it('should throw when combined >100KB', () => {
      const filePath = path.join(tempDir, 'half.md');
      const halfContent = 'x'.repeat(60 * 1024); // 60KB
      fs.writeFileSync(filePath, halfContent);

      const inlineContent = 'y'.repeat(50 * 1024); // 50KB

      expect(() =>
        loadContext({
          context: 'half.md',
          contextText: inlineContent,
        })
      ).toThrow(ContextError);
    });
  });
});
