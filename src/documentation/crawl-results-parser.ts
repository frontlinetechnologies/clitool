/**
 * Parser for crawl results JSON input for documentation generation.
 * Uses the shared parser with documentation-specific error handling.
 */

import { createCrawlResultsParser } from '../shared/crawl-results-parser';
import { createDocumentationError, DocumentationErrorType } from './errors';

/**
 * Reads crawl results JSON from stdin and parses into typed objects.
 * Validates that required fields are present and match expected schema.
 *
 * @returns Promise resolving to parsed crawl results
 * @throws DocumentationError if input is invalid or cannot be parsed
 */
export const parseCrawlResults = createCrawlResultsParser({
  createValidationError: (message: string) =>
    createDocumentationError(DocumentationErrorType.VALIDATION_ERROR, message),
  createParseError: (message: string, cause?: Error) =>
    createDocumentationError(DocumentationErrorType.PARSE_ERROR, message, cause),
  createInvalidInputError: (message: string, cause?: Error) =>
    createDocumentationError(DocumentationErrorType.INVALID_INPUT, message, cause),
  errorName: 'DocumentationError',
});
