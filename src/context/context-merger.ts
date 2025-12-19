/**
 * Context merger module - combines multiple context sources.
 * Feature: 007-ai-context-option
 */

import {
  ContextSource,
  MergedContext,
  CONTEXT_HEADERS,
  CONTEXT_SIZE_WARNING_THRESHOLD,
} from './types';

/**
 * Merge multiple context sources into a single string with headers.
 *
 * @param sources - Array of context sources in priority order (file, inline, environment)
 * @returns MergedContext with combined content
 */
export function mergeContextSources(sources: ContextSource[]): MergedContext {
  if (sources.length === 0) {
    return {
      content: '',
      totalSize: 0,
      sources: [],
      sizeWarning: false,
    };
  }

  const parts: string[] = [];
  let totalSize = 0;

  for (const source of sources) {
    const header = CONTEXT_HEADERS[source.type];
    parts.push(`${header}\n${source.content}`);
    totalSize += source.size;
  }

  const content = parts.join('\n\n');

  return {
    content,
    totalSize,
    sources,
    sizeWarning: totalSize > CONTEXT_SIZE_WARNING_THRESHOLD,
  };
}
