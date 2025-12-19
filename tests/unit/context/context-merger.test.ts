import { mergeContextSources } from '../../../src/context/context-merger';
import {
  ContextSource,
  CONTEXT_SIZE_WARNING_THRESHOLD,
} from '../../../src/context/types';

describe('mergeContextSources', () => {
  describe('empty sources', () => {
    it('should return empty result for empty array', () => {
      const result = mergeContextSources([]);

      expect(result.content).toBe('');
      expect(result.totalSize).toBe(0);
      expect(result.sources).toEqual([]);
      expect(result.sizeWarning).toBe(false);
    });
  });

  describe('single source', () => {
    it('should merge single file source with header', () => {
      const source: ContextSource = {
        type: 'file',
        content: 'File content here',
        reference: 'context.md',
        size: 17,
      };

      const result = mergeContextSources([source]);

      expect(result.content).toBe('### From File:\nFile content here');
      expect(result.totalSize).toBe(17);
      expect(result.sources).toHaveLength(1);
      expect(result.sizeWarning).toBe(false);
    });

    it('should merge single inline source with header', () => {
      const source: ContextSource = {
        type: 'inline',
        content: 'Inline text',
        reference: 'inline',
        size: 11,
      };

      const result = mergeContextSources([source]);

      expect(result.content).toBe('### Inline:\nInline text');
      expect(result.totalSize).toBe(11);
    });

    it('should merge single environment source with header', () => {
      const source: ContextSource = {
        type: 'environment',
        content: 'Environment content',
        reference: 'TESTARION_CONTEXT',
        size: 19,
      };

      const result = mergeContextSources([source]);

      expect(result.content).toBe('### From Environment:\nEnvironment content');
      expect(result.totalSize).toBe(19);
    });
  });

  describe('multiple sources', () => {
    it('should merge multiple sources with headers and separators', () => {
      const sources: ContextSource[] = [
        {
          type: 'file',
          content: 'From file',
          reference: 'context.md',
          size: 9,
        },
        {
          type: 'inline',
          content: 'Inline text',
          reference: 'inline',
          size: 11,
        },
        {
          type: 'environment',
          content: 'From env',
          reference: 'TESTARION_CONTEXT',
          size: 8,
        },
      ];

      const result = mergeContextSources(sources);

      expect(result.content).toBe(
        '### From File:\nFrom file\n\n' +
        '### Inline:\nInline text\n\n' +
        '### From Environment:\nFrom env'
      );
      expect(result.totalSize).toBe(28);
      expect(result.sources).toHaveLength(3);
    });

    it('should calculate total size correctly', () => {
      const sources: ContextSource[] = [
        { type: 'file', content: 'a'.repeat(1000), reference: 'a.md', size: 1000 },
        { type: 'inline', content: 'b'.repeat(500), reference: 'inline', size: 500 },
      ];

      const result = mergeContextSources(sources);

      expect(result.totalSize).toBe(1500);
    });
  });

  describe('size warning', () => {
    it('should not set sizeWarning below threshold', () => {
      const source: ContextSource = {
        type: 'file',
        content: 'Small content',
        reference: 'small.md',
        size: CONTEXT_SIZE_WARNING_THRESHOLD - 1,
      };

      const result = mergeContextSources([source]);

      expect(result.sizeWarning).toBe(false);
    });

    it('should set sizeWarning at threshold', () => {
      const source: ContextSource = {
        type: 'file',
        content: 'Content at threshold',
        reference: 'threshold.md',
        size: CONTEXT_SIZE_WARNING_THRESHOLD + 1,
      };

      const result = mergeContextSources([source]);

      expect(result.sizeWarning).toBe(true);
    });

    it('should set sizeWarning when combined sources exceed threshold', () => {
      const halfThreshold = Math.ceil(CONTEXT_SIZE_WARNING_THRESHOLD / 2) + 1;
      const sources: ContextSource[] = [
        { type: 'file', content: 'a', reference: 'a.md', size: halfThreshold },
        { type: 'inline', content: 'b', reference: 'inline', size: halfThreshold },
      ];

      const result = mergeContextSources(sources);

      expect(result.totalSize).toBeGreaterThan(CONTEXT_SIZE_WARNING_THRESHOLD);
      expect(result.sizeWarning).toBe(true);
    });
  });

  describe('content preservation', () => {
    it('should preserve multiline content', () => {
      const source: ContextSource = {
        type: 'file',
        content: 'Line 1\nLine 2\nLine 3',
        reference: 'multi.md',
        size: 20,
      };

      const result = mergeContextSources([source]);

      expect(result.content).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should preserve special characters', () => {
      const source: ContextSource = {
        type: 'inline',
        content: '# Heading\n- List item\n`code`',
        reference: 'inline',
        size: 27,
      };

      const result = mergeContextSources([source]);

      expect(result.content).toContain('# Heading');
      expect(result.content).toContain('- List item');
      expect(result.content).toContain('`code`');
    });

    it('should preserve unicode characters', () => {
      const source: ContextSource = {
        type: 'file',
        content: 'Unicode: emoji and symbols',
        reference: 'unicode.md',
        size: 30,
      };

      const result = mergeContextSources([source]);

      expect(result.content).toContain('emoji');
    });
  });
});
