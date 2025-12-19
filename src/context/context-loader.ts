/**
 * Context loader module - loads context from file, inline text, and environment variable.
 * Feature: 007-ai-context-option
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ContextSource,
  ContextOptions,
  ContextLoaderResult,
  CONTEXT_SIZE_MAX,
  CONTEXT_ENV_VAR,
} from './types';
import {
  ContextError,
  createFileNotFoundError,
  createFileNotReadableError,
  createInvalidEncodingError,
  createSizeExceededError,
  createInvalidPathError,
  createInvalidFileTypeError,
  createPermissionDeniedError,
  createIsDirectoryError,
} from './errors';
import { mergeContextSources } from './context-merger';

/**
 * Load and validate a context file.
 *
 * @param filePath - Path to the context file
 * @returns ContextSource with file content
 * @throws ContextError if file not found, not readable, or invalid
 */
/** Allowed file extensions for context files */
const ALLOWED_EXTENSIONS = ['.md', '.txt'];

export function loadContextFromFile(filePath: string): ContextSource {
  const resolvedPath = path.resolve(filePath);
  const cwd = process.cwd();

  // Security: Validate path is within current working directory
  if (!resolvedPath.startsWith(cwd + path.sep) && resolvedPath !== cwd) {
    throw createInvalidPathError(filePath);
  }

  // Validate file extension
  const ext = path.extname(resolvedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw createInvalidFileTypeError(filePath);
  }

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    throw createFileNotFoundError(filePath);
  }

  // Check file size before reading
  let stats: fs.Stats;
  try {
    stats = fs.statSync(resolvedPath);
  } catch (error) {
    // Handle specific error codes
    if (error && typeof error === 'object' && 'code' in error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'EACCES') {
        throw createPermissionDeniedError(filePath);
      }
    }
    throw createFileNotReadableError(filePath);
  }

  // Check if path is a directory
  if (stats.isDirectory()) {
    throw createIsDirectoryError(filePath);
  }

  const sizeKB = Math.ceil(stats.size / 1024);
  if (stats.size > CONTEXT_SIZE_MAX) {
    throw createSizeExceededError(filePath, sizeKB);
  }

  // Read file content
  let content: string;
  try {
    const buffer = fs.readFileSync(resolvedPath);
    content = buffer.toString('utf8');

    // Check for replacement characters indicating invalid UTF-8
    if (content.includes('\uFFFD')) {
      throw createInvalidEncodingError(filePath);
    }
  } catch (error) {
    if (error instanceof ContextError) {
      throw error;
    }
    // Handle specific error codes
    if (error && typeof error === 'object' && 'code' in error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'EACCES') {
        throw createPermissionDeniedError(filePath);
      }
      if (nodeError.code === 'EISDIR') {
        throw createIsDirectoryError(filePath);
      }
    }
    throw createFileNotReadableError(filePath);
  }

  return {
    type: 'file',
    content,
    reference: filePath,
    size: Buffer.byteLength(content, 'utf8'),
  };
}

/**
 * Load context from file, inline text, and environment variable.
 * Merges all sources with labeled headers.
 *
 * @param options - CLI options containing context paths/text
 * @returns Context loader result with merged content and warnings
 * @throws ContextError if file not found, not readable, invalid UTF-8, or exceeds size limit
 */
export function loadContext(options: ContextOptions): ContextLoaderResult {
  const sources: ContextSource[] = [];
  const warnings: string[] = [];

  // 1. Check for file context (--context flag)
  if (options.context) {
    const fileSource = loadContextFromFile(options.context);
    sources.push(fileSource);
  }

  // 2. Check for inline context (--context-text flag) - filter empty/whitespace
  if (options.contextText && options.contextText.trim()) {
    const inlineSource: ContextSource = {
      type: 'inline',
      content: options.contextText,
      reference: 'inline',
      size: Buffer.byteLength(options.contextText, 'utf8'),
    };
    sources.push(inlineSource);
  }

  // 3. Check for environment context (TESTARION_CONTEXT)
  const envContext = process.env[CONTEXT_ENV_VAR];
  if (envContext) {
    const envSource: ContextSource = {
      type: 'environment',
      content: envContext,
      reference: CONTEXT_ENV_VAR,
      size: Buffer.byteLength(envContext, 'utf8'),
    };
    sources.push(envSource);
  }

  // If no sources found, return null context
  if (sources.length === 0) {
    return { context: null, warnings: [] };
  }

  // Merge sources
  const merged = mergeContextSources(sources);

  // Check total size
  if (merged.totalSize > CONTEXT_SIZE_MAX) {
    const sizeKB = Math.ceil(merged.totalSize / 1024);
    throw new ContextError(
      'SIZE_EXCEEDED',
      `Combined context exceeds 100KB limit (${sizeKB}KB).`,
      undefined,
      'Try reducing the context file size or inline text.'
    );
  }

  // Add warning if size exceeds threshold (50KB warning, 100KB max)
  if (merged.sizeWarning) {
    const sizeKB = Math.ceil(merged.totalSize / 1024);
    warnings.push(`Warning: Context is large (${sizeKB}KB, threshold 50KB, max 100KB). This may affect AI response time.`);
  }

  return { context: merged, warnings };
}
