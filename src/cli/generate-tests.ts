#!/usr/bin/env node

/**
 * CLI command for generating Playwright end-to-end tests from crawl results.
 * Entry point for the generate-tests command.
 */

import { Command } from 'commander';
import { parseCrawlResults } from '../test-generation/crawl-results-parser';
import { generateTestSuite } from '../test-generation/test-generator';
import { createTestGenerationError, TestGenerationErrorType } from '../test-generation/errors';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('generate-tests')
  .description('Generate Playwright end-to-end test scripts from crawl results')
  .option('--output-dir <directory>', 'Output directory for test files', './tests/generated/')
  .option('--anthropic-api-key <key>', 'Anthropic API key for AI-enhanced test scenarios (overrides ANTHROPIC_API_KEY environment variable)')
  .addHelpText('after', `
Examples:
  $ crawl https://example.com | generate-tests
  $ crawl https://example.com | generate-tests --output-dir ./e2e-tests
  $ crawl https://example.com | generate-tests --anthropic-api-key your-api-key
  $ cat crawl-results.json | generate-tests

The test generator will:
  - Read crawl results JSON from stdin
  - Detect user flows (login, checkout, forms)
  - Generate Playwright test files (one file per flow)
  - Save tests to output directory (default: ./tests/generated/)
  - Handle empty results gracefully
  - Use AI-enhanced test scenarios if API key is provided (via --anthropic-api-key or ANTHROPIC_API_KEY environment variable)

Input Format:
  Expects JSON matching the crawl command output schema:
  {
    "summary": { ... },
    "pages": [ ... ],
    "forms": [ ... ],
    "buttons": [ ... ],
    "inputFields": [ ... ]
  }
  `)
  .action(async (options) => {
    try {
      // Parse crawl results from stdin
      const crawlResults = await parseCrawlResults();

      // Determine output directory
      const outputDir = path.resolve(options.outputDir || './tests/generated/');

      // Create directory if needed
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Validate directory is writable (per FR-015)
      try {
        fs.accessSync(outputDir, fs.constants.W_OK);
      } catch (error) {
        throw createTestGenerationError(
          TestGenerationErrorType.FILE_WRITE_ERROR,
          `Cannot write to ${outputDir}: ${error instanceof Error ? error.message : 'Permission denied'}`,
          error instanceof Error ? error : undefined,
        );
      }

      // Check for existing files and warn (per FR-016)
      const existingFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.spec.ts'));
      if (existingFiles.length > 0) {
        console.error(`Warning: Found ${existingFiles.length} existing test file(s) in ${outputDir}`);
        console.error('Existing files will be overwritten.');
      }

      // Generate test suite
      const testSuite = await generateTestSuite(crawlResults, outputDir, options.anthropicApiKey);

      // Write test files
      for (const testFile of testSuite.testFiles) {
        const filePath = path.join(outputDir, testFile.filename);
        
        // Generate code if not already generated
        if (!testFile.code) {
          const { generatePlaywrightCode } = await import('../test-generation/playwright-codegen');
          testFile.code = generatePlaywrightCode(testFile);
        }

        try {
          fs.writeFileSync(filePath, testFile.code, 'utf-8');
        } catch (error) {
          throw createTestGenerationError(
            TestGenerationErrorType.FILE_WRITE_ERROR,
            `Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error instanceof Error ? error : undefined,
          );
        }
      }

      // Display summary
      console.error(`Generated ${testSuite.summary.totalTestFiles} test file(s) with ${testSuite.summary.totalTestCases} test case(s)`);
      console.error(`Output directory: ${outputDir}`);

      process.exit(0);
    } catch (error) {
      if (error instanceof Error && error.name === 'TestGenerationError') {
        const testError = error as ReturnType<typeof createTestGenerationError>;
        console.error('Error:', testError.toUserMessage());
        process.exit(1);
      }
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export { program };

