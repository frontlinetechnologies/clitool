/**
 * Type definitions for the context loading module.
 * Feature: 007-ai-context-option
 */

/**
 * Enumeration of context source types.
 */
export type ContextSourceType = 'file' | 'inline' | 'environment';

/**
 * Represents a single source of context with its content.
 */
export interface ContextSource {
  /** The type of context source */
  type: ContextSourceType;

  /** The raw content from this source */
  content: string;

  /** Original reference (file path, env var name, or 'inline') */
  reference: string;

  /** Size in bytes */
  size: number;
}

/**
 * Context-related CLI options.
 */
export interface ContextOptions {
  /** Path to context file (--context flag) */
  context?: string;

  /** Inline context text (--context-text flag) */
  contextText?: string;
}

/**
 * Result of merging multiple context sources.
 */
export interface MergedContext {
  /** Combined context content with headers */
  content: string;

  /** Total size in bytes */
  totalSize: number;

  /** Individual sources that were merged */
  sources: ContextSource[];

  /** Whether a size warning should be displayed */
  sizeWarning: boolean;
}

/**
 * Result of loading context from all sources.
 */
export interface ContextLoaderResult {
  /** The merged context, or null if no context provided */
  context: MergedContext | null;

  /** Warning messages to display (e.g., size warnings) */
  warnings: string[];
}

/** Size threshold for warning (50KB) */
export const CONTEXT_SIZE_WARNING_THRESHOLD = 50 * 1024; // 51,200 bytes

/** Maximum allowed context size (100KB) */
export const CONTEXT_SIZE_MAX = 100 * 1024; // 102,400 bytes

/** Environment variable name for context */
export const CONTEXT_ENV_VAR = 'TESTARION_CONTEXT';

/** Header templates for merged context */
export const CONTEXT_HEADERS: Record<ContextSourceType, string> = {
  file: '### From File:',
  inline: '### Inline:',
  environment: '### From Environment:',
} as const;
