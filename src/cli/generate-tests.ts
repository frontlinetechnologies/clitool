#!/usr/bin/env node

/**
 * CLI command for generating Playwright end-to-end tests from crawl results.
 * Entry point for the generate-tests command.
 */

import { Command } from 'commander';
import { parseCrawlResults } from '../test-generation/crawl-results-parser';
import { generateTestSuite } from '../test-generation/test-generator';
import { createTestGenerationError, TestGenerationErrorType } from '../test-generation/errors';
import { isAIError } from '../ai/errors';
import {
  resolveApiKey,
  shouldPromptToSave,
  writeConfigFile,
  getProjectConfigPath,
  getGlobalConfigPath,
  setPromptShownState,
  ConfigError,
} from '../utils/config-loader';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface GenerateTestsOptions {
  outputDir?: string;
  anthropicApiKey?: string;
  verbose?: boolean;
}

const program = new Command();

program
  .name('generate-tests')
  .description('Generate Playwright end-to-end test scripts from crawl results')
  .option('--output-dir <directory>', 'Output directory for test files', './tests/generated/')
  .option('--anthropic-api-key <key>', 'Anthropic API key for AI-enhanced test scenarios (overrides ANTHROPIC_API_KEY environment variable and config files)')
  .option('--verbose', 'Show detailed information including API key configuration guidance')
  .addHelpText('after', `
Examples:
  $ testarion crawl https://example.com | testarion generate-tests
  $ testarion crawl https://example.com | testarion generate-tests --output-dir ./e2e-tests
  $ testarion crawl https://example.com | testarion generate-tests --anthropic-api-key your-api-key
  $ cat crawl-results.json | testarion generate-tests

The test generator will:
  - Read crawl results JSON from stdin
  - Detect user flows (login, checkout, forms)
  - Generate Playwright test files (one file per flow)
  - Save tests to output directory (default: ./tests/generated/)
  - Handle empty results gracefully
  - Use AI-enhanced test scenarios if API key is provided (via --anthropic-api-key, ANTHROPIC_API_KEY environment variable, or config file at .testarion/config.json or ~/.testarion/config.json)

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
  .action(async (options: GenerateTestsOptions) => {
    try {
      // Resolve API key from all sources (CLI > env > project config > global config)
      let apiKey: string | null = null;
      try {
        apiKey = resolveApiKey(options.anthropicApiKey);
      } catch (error) {
        if (error instanceof ConfigError) {
          console.error('Error:', error.message);
          if (error.filePath) {
            console.error(`  File: ${error.filePath}`);
          }
          process.exit(1);
        }
        throw error;
      }

      // Show guidance if no API key and verbose mode
      if (!apiKey && options.verbose) {
        console.error('No API key configured. Set ANTHROPIC_API_KEY, use --anthropic-api-key, or create config file at .testarion/config.json or ~/.testarion/config.json');
      }

      // Offer to save API key if provided via CLI/env and no config exists
      if (apiKey && shouldPromptToSave(options.anthropicApiKey, process.env.ANTHROPIC_API_KEY)) {
        await promptToSaveApiKey(apiKey);
      }

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
      const testSuite = await generateTestSuite(crawlResults, outputDir, apiKey || undefined);

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
      if (isAIError(error)) {
        console.error('Error:', error.toUserMessage());
        process.exit(1);
      }
      if (error instanceof Error && error.name === 'TestGenerationError') {
        const testError = error as ReturnType<typeof createTestGenerationError>;
        console.error('Error:', testError.toUserMessage());
        process.exit(1);
      }
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Prompts user to save API key to a config file.
 * @param apiKey - The API key to save
 */
async function promptToSaveApiKey(apiKey: string): Promise<void> {
  // Mark that we've shown the prompt this session
  setPromptShownState(true);

  // Don't prompt if stdin is not a TTY (piped input)
  if (!process.stdin.isTTY) {
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr, // Use stderr to avoid polluting stdout
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  };

  try {
    console.error('\nAPI key provided via command line. Save to config file? (y/n)');
    const saveAnswer = await question('> ');

    if (saveAnswer.toLowerCase() !== 'y' && saveAnswer.toLowerCase() !== 'yes') {
      return;
    }

    console.error('\nChoose location:');
    console.error('  1) Project-level (.testarion/config.json)');
    console.error('  2) Global (~/.testarion/config.json)');
    const locationAnswer = await question('> ');

    let configPath: string;
    if (locationAnswer === '1') {
      configPath = getProjectConfigPath();
    } else if (locationAnswer === '2') {
      configPath = getGlobalConfigPath();
    } else {
      console.error('Invalid selection. API key not saved.');
      return;
    }

    try {
      writeConfigFile(configPath, apiKey);
      console.error(`API key saved to ${configPath}`);
    } catch (error) {
      if (error instanceof ConfigError) {
        console.error(`Failed to save API key: ${error.message}`);
      } else {
        console.error(`Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } finally {
    rl.close();
  }
}

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export { program };

