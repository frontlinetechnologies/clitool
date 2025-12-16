/**
 * Parser for crawl results JSON input for test generation.
 * Uses the shared parser with test-generation-specific error handling.
 */

import { createCrawlResultsParser } from '../shared/crawl-results-parser';
import { createTestGenerationError, TestGenerationErrorType } from './errors';

/**
 * Reads crawl results JSON from stdin and parses into typed objects.
 * Validates that required fields are present and match expected schema.
 *
 * @returns Promise resolving to parsed crawl results
 * @throws TestGenerationError if input is invalid or cannot be parsed
 */
export const parseCrawlResults = createCrawlResultsParser({
  createValidationError: (message: string) =>
    createTestGenerationError(TestGenerationErrorType.VALIDATION_ERROR, message),
  createParseError: (message: string, cause?: Error) =>
    createTestGenerationError(TestGenerationErrorType.PARSE_ERROR, message, cause),
  createInvalidInputError: (message: string, cause?: Error) =>
    createTestGenerationError(TestGenerationErrorType.INVALID_INPUT, message, cause),
  errorName: 'TestGenerationError',
});
