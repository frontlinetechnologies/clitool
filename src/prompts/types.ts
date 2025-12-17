/**
 * Type definitions for the prompt management module.
 * Feature: 001-ai-system-prompts
 */

/**
 * Prompt variable definition from frontmatter.
 */
export interface PromptVariable {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

/**
 * Source information for a loaded prompt.
 */
export interface PromptSource {
  type: 'user' | 'default';
  filePath: string;
  isFallback: boolean;
}

/**
 * Loaded and parsed system prompt.
 */
export interface SystemPrompt {
  name: string;
  version: string;
  description: string;
  maxTokens: number;
  variables: PromptVariable[];
  templateContent: string;
  source: PromptSource;
  loadedAt: Date;
}

/**
 * Context for rendering a prompt template.
 */
export interface PromptContext {
  variables: Record<string, string | undefined>;
  verbose?: boolean;
}

/**
 * Result of rendering a prompt.
 */
export interface PromptRenderResult {
  renderedContent: string;
  source: PromptSource;
  substitutedVariables: string[];
  missingOptionalVariables: string[];
  maxTokens: number;
}

/**
 * Configuration options for the prompt loader.
 */
export interface PromptLoaderOptions {
  /** Base directory for prompts (defaults to project root 'prompts/') */
  promptsDir?: string;
  /** Whether to enable verbose logging */
  verbose?: boolean;
}
