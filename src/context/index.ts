/**
 * Context module - provides context loading for AI prompts.
 * Feature: 007-ai-context-option
 */

export { loadContext, loadContextFromFile } from './context-loader';
export { mergeContextSources } from './context-merger';
export {
  ContextError,
  isContextError,
  createFileNotFoundError,
  createFileNotReadableError,
  createInvalidEncodingError,
  createSizeExceededError,
} from './errors';
export type {
  ContextSourceType,
  ContextSource,
  ContextOptions,
  MergedContext,
  ContextLoaderResult,
} from './types';
export {
  CONTEXT_SIZE_WARNING_THRESHOLD,
  CONTEXT_SIZE_MAX,
  CONTEXT_ENV_VAR,
  CONTEXT_HEADERS,
} from './types';
