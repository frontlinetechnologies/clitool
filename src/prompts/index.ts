/**
 * Public API for the prompt management module.
 * Feature: 001-ai-system-prompts
 */

// Types
export {
  PromptVariable,
  PromptSource,
  SystemPrompt,
  PromptContext,
  PromptRenderResult,
  PromptLoaderOptions,
} from './types';

// Errors
export {
  PromptErrorType,
  PromptError,
  createPromptError,
  isPromptError,
} from './errors';

// Template engine
export { renderTemplate, TemplateRenderResult } from './template-engine';

// Prompt validator
export { parsePromptFile, validatePromptContent } from './prompt-validator';

// Prompt loader (main API)
export {
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
} from './prompt-loader';
