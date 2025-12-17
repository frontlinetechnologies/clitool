/**
 * Tests for prompt template engine.
 * Feature: 001-ai-system-prompts
 */

import { renderTemplate } from '../../../src/prompts/template-engine';
import { PromptVariable, PromptContext } from '../../../src/prompts/types';
import { PromptErrorType, isPromptError } from '../../../src/prompts/errors';

describe('template-engine', () => {
  describe('renderTemplate', () => {
    const filePath = '/test/prompt.md';

    it('substitutes simple variables', () => {
      const template = 'Hello {{name}}, welcome to {{place}}!';
      const variables: PromptVariable[] = [
        { name: 'name', required: true, description: 'User name' },
        { name: 'place', required: true, description: 'Location' },
      ];
      const context: PromptContext = {
        variables: { name: 'Alice', place: 'Wonderland' },
      };

      const result = renderTemplate(template, context, variables, filePath);

      expect(result.rendered).toBe('Hello Alice, welcome to Wonderland!');
      expect(result.substituted).toContain('name');
      expect(result.substituted).toContain('place');
      expect(result.missingOptional).toEqual([]);
    });

    it('throws error for missing required variables', () => {
      const template = 'URL: {{url}}';
      const variables: PromptVariable[] = [
        { name: 'url', required: true, description: 'The URL' },
      ];
      const context: PromptContext = { variables: {} };

      try {
        renderTemplate(template, context, variables, filePath);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(isPromptError(error)).toBe(true);
        if (isPromptError(error)) {
          expect(error.type).toBe(PromptErrorType.MISSING_REQUIRED_VARIABLE);
          expect(error.field).toBe('url');
        }
      }
    });

    it('handles optional variables with empty string', () => {
      const template = 'Title: {{title}}';
      const variables: PromptVariable[] = [
        { name: 'title', required: false, description: 'Optional title' },
      ];
      const context: PromptContext = { variables: {} };

      const result = renderTemplate(template, context, variables, filePath);

      expect(result.rendered).toBe('Title: ');
      expect(result.missingOptional).toContain('title');
    });

    it('uses default values for optional variables', () => {
      const template = 'Language: {{lang}}';
      const variables: PromptVariable[] = [
        {
          name: 'lang',
          required: false,
          description: 'Language',
          defaultValue: 'English',
        },
      ];
      const context: PromptContext = { variables: {} };

      const result = renderTemplate(template, context, variables, filePath);

      expect(result.rendered).toBe('Language: English');
      expect(result.substituted).toContain('lang');
    });

    it('processes conditional blocks when variable is present', () => {
      const template = '{{#if title}}Title: {{title}}{{/if}}';
      const variables: PromptVariable[] = [
        { name: 'title', required: false, description: 'Title' },
      ];
      const context: PromptContext = { variables: { title: 'My Page' } };

      const result = renderTemplate(template, context, variables, filePath);

      expect(result.rendered).toBe('Title: My Page');
    });

    it('removes conditional blocks when variable is absent', () => {
      const template = 'Start{{#if title}}Title: {{title}}{{/if}}End';
      const variables: PromptVariable[] = [
        { name: 'title', required: false, description: 'Title' },
      ];
      const context: PromptContext = { variables: {} };

      const result = renderTemplate(template, context, variables, filePath);

      expect(result.rendered).toBe('StartEnd');
    });

    it('removes conditional blocks when variable is empty string', () => {
      const template = 'Start{{#if title}}Title: {{title}}{{/if}}End';
      const variables: PromptVariable[] = [
        { name: 'title', required: false, description: 'Title' },
      ];
      const context: PromptContext = { variables: { title: '' } };

      const result = renderTemplate(template, context, variables, filePath);

      expect(result.rendered).toBe('StartEnd');
    });

    it('handles multiple conditionals', () => {
      const template =
        '{{#if a}}A={{a}}{{/if}} {{#if b}}B={{b}}{{/if}} {{#if c}}C={{c}}{{/if}}';
      const variables: PromptVariable[] = [
        { name: 'a', required: false, description: 'A' },
        { name: 'b', required: false, description: 'B' },
        { name: 'c', required: false, description: 'C' },
      ];
      const context: PromptContext = { variables: { a: '1', c: '3' } };

      const result = renderTemplate(template, context, variables, filePath);

      expect(result.rendered).toBe('A=1  C=3');
    });

    it('handles nested content in conditionals', () => {
      const template = '{{#if content}}\nContent:\n{{content}}\n{{/if}}';
      const variables: PromptVariable[] = [
        { name: 'content', required: false, description: 'Content' },
      ];
      const context: PromptContext = {
        variables: { content: 'Line1\nLine2' },
      };

      const result = renderTemplate(template, context, variables, filePath);

      expect(result.rendered).toBe('\nContent:\nLine1\nLine2\n');
    });

    it('leaves unknown variables unchanged', () => {
      const template = 'Known: {{known}}, Unknown: {{unknown}}';
      const variables: PromptVariable[] = [
        { name: 'known', required: true, description: 'Known var' },
      ];
      const context: PromptContext = { variables: { known: 'value' } };

      const result = renderTemplate(template, context, variables, filePath);

      expect(result.rendered).toBe('Known: value, Unknown: {{unknown}}');
    });

    it('handles empty template', () => {
      const result = renderTemplate('', { variables: {} }, [], filePath);
      expect(result.rendered).toBe('');
    });

    it('handles template with no variables', () => {
      const template = 'Static content without variables';
      const result = renderTemplate(template, { variables: {} }, [], filePath);
      expect(result.rendered).toBe('Static content without variables');
    });
  });
});
