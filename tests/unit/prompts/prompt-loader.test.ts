/**
 * Tests for prompt loader.
 * Feature: 001-ai-system-prompts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  initializePromptLoader,
  getPromptLoaderConfig,
  clearPromptCache,
  getPromptPaths,
  loadPrompt,
  renderPrompt,
  loadAndRenderPrompt,
  listPrompts,
  promptExists,
  validatePromptFile,
  validateContext,
  resetPrompt,
  resetAllPrompts,
  initializePromptsDirectory,
} from '../../../src/prompts/prompt-loader';
import { PromptErrorType, isPromptError } from '../../../src/prompts/errors';
import { SystemPrompt } from '../../../src/prompts/types';

describe('prompt-loader', () => {
  let testDir: string;
  let promptsDir: string;
  let defaultsDir: string;

  beforeEach(async () => {
    // Create temp directory for tests
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-loader-test-'));
    promptsDir = path.join(testDir, 'prompts');
    defaultsDir = path.join(promptsDir, 'defaults');

    await fs.mkdir(promptsDir, { recursive: true });
    await fs.mkdir(defaultsDir, { recursive: true });

    // Initialize with test directory
    initializePromptLoader({ promptsDir, verbose: false });
  });

  afterEach(async () => {
    clearPromptCache();
    // Clean up temp directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('initializePromptLoader', () => {
    it('sets configuration', () => {
      initializePromptLoader({ promptsDir: '/custom/path', verbose: true });
      const config = getPromptLoaderConfig();

      expect(config?.promptsDir).toBe('/custom/path');
      expect(config?.verbose).toBe(true);
    });

    it('uses defaults when no options provided', () => {
      initializePromptLoader();
      const config = getPromptLoaderConfig();

      expect(config?.promptsDir).toContain('prompts');
      expect(config?.verbose).toBe(false);
    });

    it('clears cache on initialization', async () => {
      // Create a default prompt
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Test
max_tokens: 100
---

Content v1`
      );

      // Load prompt to cache it
      const prompt1 = await loadPrompt('test');
      expect(prompt1.templateContent).toBe('Content v1');

      // Update the file
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Test
max_tokens: 100
---

Content v2`
      );

      // Re-initialize (should clear cache)
      initializePromptLoader({ promptsDir });

      // Load again - should get new content
      const prompt2 = await loadPrompt('test');
      expect(prompt2.templateContent).toBe('Content v2');
    });
  });

  describe('getPromptPaths', () => {
    it('returns correct paths', () => {
      const paths = getPromptPaths('page-analysis');

      expect(paths.userPath).toBe(path.join(promptsDir, 'page-analysis.md'));
      expect(paths.defaultPath).toBe(
        path.join(defaultsDir, 'page-analysis.md')
      );
    });
  });

  describe('loadPrompt', () => {
    it('loads user prompt when available', async () => {
      // Create both user and default prompts
      await fs.writeFile(
        path.join(promptsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: User version
max_tokens: 100
---

User content`
      );

      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Default version
max_tokens: 100
---

Default content`
      );

      const prompt = await loadPrompt('test');

      expect(prompt.source.type).toBe('user');
      expect(prompt.templateContent).toBe('User content');
      expect(prompt.source.isFallback).toBe(false);
    });

    it('falls back to default when user prompt not found', async () => {
      // Create only default prompt
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Default
max_tokens: 100
---

Default content`
      );

      const prompt = await loadPrompt('test');

      expect(prompt.source.type).toBe('default');
      expect(prompt.templateContent).toBe('Default content');
      expect(prompt.source.isFallback).toBe(true);
    });

    it('falls back to default when user prompt is invalid', async () => {
      // Create invalid user prompt and valid default
      await fs.writeFile(
        path.join(promptsDir, 'test.md'),
        'Invalid - no frontmatter'
      );

      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Default
max_tokens: 100
---

Default content`
      );

      const prompt = await loadPrompt('test');

      expect(prompt.source.type).toBe('default');
      expect(prompt.source.isFallback).toBe(true);
    });

    it('throws when neither user nor default exists', async () => {
      try {
        await loadPrompt('nonexistent');
        fail('Expected error');
      } catch (error) {
        expect(isPromptError(error)).toBe(true);
        if (isPromptError(error)) {
          expect(error.type).toBe(PromptErrorType.FILE_NOT_FOUND);
        }
      }
    });

    it('caches loaded prompts', async () => {
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Test
max_tokens: 100
---

Content`
      );

      const prompt1 = await loadPrompt('test');
      const prompt2 = await loadPrompt('test');

      expect(prompt1).toBe(prompt2); // Same object reference
    });
  });

  describe('renderPrompt', () => {
    it('renders template with variables', async () => {
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Test
max_tokens: 100
variables:
  - name: url
    required: true
    description: URL
---

URL: {{url}}`
      );

      const prompt = await loadPrompt('test');
      const result = renderPrompt(prompt, { variables: { url: 'https://example.com' } });

      expect(result.renderedContent).toBe('URL: https://example.com');
      expect(result.substitutedVariables).toContain('url');
      expect(result.maxTokens).toBe(100);
    });
  });

  describe('loadAndRenderPrompt', () => {
    it('loads and renders in one call', async () => {
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Test
max_tokens: 100
variables:
  - name: name
    required: true
    description: Name
---

Hello {{name}}`
      );

      const result = await loadAndRenderPrompt('test', {
        variables: { name: 'World' },
      });

      expect(result.renderedContent).toBe('Hello World');
    });
  });

  describe('listPrompts', () => {
    it('lists prompts from both directories', async () => {
      await fs.writeFile(
        path.join(promptsDir, 'user-prompt.md'),
        `---
name: user-prompt
version: 1.0.0
description: User
max_tokens: 100
---

Content`
      );

      await fs.writeFile(
        path.join(defaultsDir, 'default-prompt.md'),
        `---
name: default-prompt
version: 1.0.0
description: Default
max_tokens: 100
---

Content`
      );

      const prompts = await listPrompts();

      expect(prompts).toContain('user-prompt');
      expect(prompts).toContain('default-prompt');
    });

    it('deduplicates prompts', async () => {
      await fs.writeFile(
        path.join(promptsDir, 'same.md'),
        `---
name: same
version: 1.0.0
description: User
max_tokens: 100
---

User`
      );

      await fs.writeFile(
        path.join(defaultsDir, 'same.md'),
        `---
name: same
version: 1.0.0
description: Default
max_tokens: 100
---

Default`
      );

      const prompts = await listPrompts();
      const sameCount = prompts.filter((p) => p === 'same').length;

      expect(sameCount).toBe(1);
    });

    it('returns sorted list', async () => {
      await fs.writeFile(
        path.join(defaultsDir, 'z-prompt.md'),
        `---
name: z
version: 1.0.0
description: Z
max_tokens: 100
---

Z`
      );

      await fs.writeFile(
        path.join(defaultsDir, 'a-prompt.md'),
        `---
name: a
version: 1.0.0
description: A
max_tokens: 100
---

A`
      );

      const prompts = await listPrompts();
      const aIndex = prompts.indexOf('a-prompt');
      const zIndex = prompts.indexOf('z-prompt');

      expect(aIndex).toBeLessThan(zIndex);
    });
  });

  describe('promptExists', () => {
    it('returns true for user prompt', async () => {
      await fs.writeFile(
        path.join(promptsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Test
max_tokens: 100
---

Content`
      );

      expect(await promptExists('test')).toBe(true);
    });

    it('returns true for default prompt', async () => {
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Test
max_tokens: 100
---

Content`
      );

      expect(await promptExists('test')).toBe(true);
    });

    it('returns false for nonexistent prompt', async () => {
      expect(await promptExists('nonexistent')).toBe(false);
    });
  });

  describe('validatePromptFile', () => {
    it('validates existing file', async () => {
      const filePath = path.join(promptsDir, 'test.md');
      await fs.writeFile(
        filePath,
        `---
name: test
version: 1.0.0
description: Test
max_tokens: 100
---

Content`
      );

      const result = await validatePromptFile(filePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns error for nonexistent file', async () => {
      const result = await validatePromptFile('/nonexistent/file.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('validateContext', () => {
    it('validates complete context', () => {
      const prompt: SystemPrompt = {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
        maxTokens: 100,
        variables: [
          { name: 'url', required: true, description: 'URL' },
          { name: 'title', required: false, description: 'Title' },
        ],
        templateContent: '',
        source: { type: 'default', filePath: '/test.md', isFallback: false },
        loadedAt: new Date(),
      };

      const result = validateContext(prompt, {
        variables: { url: 'https://example.com', title: 'Test' },
      });

      expect(result.valid).toBe(true);
      expect(result.missingRequired).toEqual([]);
    });

    it('detects missing required variables', () => {
      const prompt: SystemPrompt = {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
        maxTokens: 100,
        variables: [
          { name: 'url', required: true, description: 'URL' },
        ],
        templateContent: '',
        source: { type: 'default', filePath: '/test.md', isFallback: false },
        loadedAt: new Date(),
      };

      const result = validateContext(prompt, { variables: {} });

      expect(result.valid).toBe(false);
      expect(result.missingRequired).toContain('url');
    });

    it('detects unused provided variables', () => {
      const prompt: SystemPrompt = {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
        maxTokens: 100,
        variables: [{ name: 'url', required: true, description: 'URL' }],
        templateContent: '',
        source: { type: 'default', filePath: '/test.md', isFallback: false },
        loadedAt: new Date(),
      };

      const result = validateContext(prompt, {
        variables: { url: 'https://example.com', extra: 'unused' },
      });

      expect(result.unusedProvided).toContain('extra');
    });
  });

  describe('resetPrompt', () => {
    it('copies default to user location', async () => {
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Default
max_tokens: 100
---

Default content`
      );

      await resetPrompt('test');

      const userContent = await fs.readFile(
        path.join(promptsDir, 'test.md'),
        'utf-8'
      );
      expect(userContent).toContain('Default content');
    });

    it('throws when default not found', async () => {
      try {
        await resetPrompt('nonexistent');
        fail('Expected error');
      } catch (error) {
        expect(isPromptError(error)).toBe(true);
        if (isPromptError(error)) {
          expect(error.type).toBe(PromptErrorType.FILE_NOT_FOUND);
        }
      }
    });

    it('clears cache after reset', async () => {
      // Create default
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Default
max_tokens: 100
---

Default`
      );

      // Create user version and load it
      await fs.writeFile(
        path.join(promptsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: User
max_tokens: 100
---

User content`
      );

      const before = await loadPrompt('test');
      expect(before.templateContent).toBe('User content');

      // Reset
      await resetPrompt('test');
      clearPromptCache(); // Clear cache to reload

      const after = await loadPrompt('test');
      expect(after.templateContent).toBe('Default');
    });
  });

  describe('resetAllPrompts', () => {
    it('resets all defaults to user directory', async () => {
      await fs.writeFile(
        path.join(defaultsDir, 'prompt1.md'),
        `---
name: prompt1
version: 1.0.0
description: Prompt 1
max_tokens: 100
---

Content 1`
      );

      await fs.writeFile(
        path.join(defaultsDir, 'prompt2.md'),
        `---
name: prompt2
version: 1.0.0
description: Prompt 2
max_tokens: 100
---

Content 2`
      );

      const reset = await resetAllPrompts();

      expect(reset).toContain('prompt1');
      expect(reset).toContain('prompt2');

      // Verify files were created
      const user1 = await fs.readFile(
        path.join(promptsDir, 'prompt1.md'),
        'utf-8'
      );
      expect(user1).toContain('Content 1');
    });
  });

  describe('initializePromptsDirectory', () => {
    it('copies defaults when no user prompts exist', async () => {
      // Remove user prompts dir content
      const entries = await fs.readdir(promptsDir);
      for (const entry of entries) {
        if (entry !== 'defaults') {
          await fs.rm(path.join(promptsDir, entry), { recursive: true });
        }
      }

      // Create default
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Test
max_tokens: 100
---

Content`
      );

      await initializePromptsDirectory();

      const userFiles = await fs.readdir(promptsDir);
      expect(userFiles).toContain('test.md');
    });

    it('does not overwrite existing user prompts', async () => {
      // Create user prompt
      await fs.writeFile(
        path.join(promptsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: User
max_tokens: 100
---

User content`
      );

      // Create different default
      await fs.writeFile(
        path.join(defaultsDir, 'test.md'),
        `---
name: test
version: 1.0.0
description: Default
max_tokens: 100
---

Default content`
      );

      await initializePromptsDirectory();

      const content = await fs.readFile(
        path.join(promptsDir, 'test.md'),
        'utf-8'
      );
      expect(content).toContain('User content');
    });
  });
});
