/**
 * Tests for prompt validator (YAML frontmatter parsing).
 * Feature: 001-ai-system-prompts
 */

import {
  parsePromptFile,
  validatePromptContent,
} from '../../../src/prompts/prompt-validator';
import { PromptSource } from '../../../src/prompts/types';
import { PromptErrorType, isPromptError } from '../../../src/prompts/errors';

describe('prompt-validator', () => {
  const filePath = '/test/prompt.md';
  const defaultSource: PromptSource = {
    type: 'user',
    filePath,
    isFallback: false,
  };

  describe('parsePromptFile', () => {
    it('parses valid prompt with all fields', () => {
      const content = `---
name: test-prompt
version: 1.0.0
description: A test prompt
max_tokens: 500
variables:
  - name: url
    required: true
    description: The URL to analyze
  - name: title
    required: false
    description: Optional title
    default: Untitled
---

Analyze this URL: {{url}}
Title: {{title}}`;

      const result = parsePromptFile(content, filePath, defaultSource);

      expect(result.name).toBe('test-prompt');
      expect(result.version).toBe('1.0.0');
      expect(result.description).toBe('A test prompt');
      expect(result.maxTokens).toBe(500);
      expect(result.variables).toHaveLength(2);
      expect(result.variables[0]).toEqual({
        name: 'url',
        required: true,
        description: 'The URL to analyze',
        defaultValue: undefined,
      });
      expect(result.variables[1]).toEqual({
        name: 'title',
        required: false,
        description: 'Optional title',
        defaultValue: 'Untitled',
      });
      expect(result.templateContent).toBe(
        'Analyze this URL: {{url}}\nTitle: {{title}}'
      );
      expect(result.source).toBe(defaultSource);
    });

    it('throws for missing frontmatter', () => {
      const content = 'Just content without frontmatter';

      try {
        parsePromptFile(content, filePath, defaultSource);
        fail('Expected error');
      } catch (error) {
        expect(isPromptError(error)).toBe(true);
        if (isPromptError(error)) {
          expect(error.type).toBe(PromptErrorType.INVALID_FRONTMATTER);
        }
      }
    });

    it('throws for missing required field: name', () => {
      const content = `---
version: 1.0.0
description: Missing name
max_tokens: 500
---

Content`;

      try {
        parsePromptFile(content, filePath, defaultSource);
        fail('Expected error');
      } catch (error) {
        expect(isPromptError(error)).toBe(true);
        if (isPromptError(error)) {
          expect(error.type).toBe(PromptErrorType.MISSING_REQUIRED_FIELD);
          expect(error.field).toBe('name');
        }
      }
    });

    it('throws for missing required field: version', () => {
      const content = `---
name: test
description: Missing version
max_tokens: 500
---

Content`;

      try {
        parsePromptFile(content, filePath, defaultSource);
        fail('Expected error');
      } catch (error) {
        expect(isPromptError(error)).toBe(true);
        if (isPromptError(error)) {
          expect(error.type).toBe(PromptErrorType.MISSING_REQUIRED_FIELD);
          expect(error.field).toBe('version');
        }
      }
    });

    it('throws for missing required field: description', () => {
      const content = `---
name: test
version: 1.0.0
max_tokens: 500
---

Content`;

      try {
        parsePromptFile(content, filePath, defaultSource);
        fail('Expected error');
      } catch (error) {
        expect(isPromptError(error)).toBe(true);
        if (isPromptError(error)) {
          expect(error.type).toBe(PromptErrorType.MISSING_REQUIRED_FIELD);
          expect(error.field).toBe('description');
        }
      }
    });

    it('throws for missing required field: max_tokens', () => {
      const content = `---
name: test
version: 1.0.0
description: Missing max_tokens
---

Content`;

      try {
        parsePromptFile(content, filePath, defaultSource);
        fail('Expected error');
      } catch (error) {
        expect(isPromptError(error)).toBe(true);
        if (isPromptError(error)) {
          expect(error.type).toBe(PromptErrorType.MISSING_REQUIRED_FIELD);
          expect(error.field).toBe('max_tokens');
        }
      }
    });

    it('throws for variable without name', () => {
      const content = `---
name: test
version: 1.0.0
description: Test
max_tokens: 500
variables:
  - required: true
    description: Missing name field
---

Content`;

      try {
        parsePromptFile(content, filePath, defaultSource);
        fail('Expected error');
      } catch (error) {
        expect(isPromptError(error)).toBe(true);
        if (isPromptError(error)) {
          expect(error.type).toBe(PromptErrorType.INVALID_VARIABLE);
        }
      }
    });

    it('handles prompts without variables', () => {
      const content = `---
name: simple
version: 1.0.0
description: No variables
max_tokens: 100
---

Static content`;

      const result = parsePromptFile(content, filePath, defaultSource);

      expect(result.variables).toEqual([]);
    });

    it('defaults variable required to true', () => {
      const content = `---
name: test
version: 1.0.0
description: Test
max_tokens: 500
variables:
  - name: url
    description: URL without required field
---

{{url}}`;

      const result = parsePromptFile(content, filePath, defaultSource);

      expect(result.variables[0].required).toBe(true);
    });

    it('parses boolean values correctly', () => {
      const content = `---
name: test
version: 1.0.0
description: Test
max_tokens: 500
variables:
  - name: required_var
    required: true
    description: Required
  - name: optional_var
    required: false
    description: Optional
---

Content`;

      const result = parsePromptFile(content, filePath, defaultSource);

      expect(result.variables[0].required).toBe(true);
      expect(result.variables[1].required).toBe(false);
    });

    it('parses quoted values correctly', () => {
      const content = `---
name: "quoted-name"
version: '1.0.0'
description: "A description with: colons"
max_tokens: 500
---

Content`;

      const result = parsePromptFile(content, filePath, defaultSource);

      expect(result.name).toBe('quoted-name');
      expect(result.version).toBe('1.0.0');
      expect(result.description).toBe('A description with: colons');
    });
  });

  describe('validatePromptContent', () => {
    it('returns valid for correct prompt', () => {
      const content = `---
name: test
version: 1.0.0
description: Test
max_tokens: 500
---

Content`;

      const result = validatePromptContent(content, filePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns errors for invalid prompt', () => {
      const content = 'No frontmatter';

      const result = validatePromptContent(content, filePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe(PromptErrorType.INVALID_FRONTMATTER);
    });

    it('returns errors for missing fields', () => {
      const content = `---
name: test
---

Content`;

      const result = validatePromptContent(content, filePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
});
