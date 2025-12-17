#!/usr/bin/env node

/**
 * CLI command for generating site documentation from crawl results.
 * Entry point for the generate-docs command.
 */

import { Command } from 'commander';
import { parseCrawlResults } from '../documentation/crawl-results-parser';
import { generateDocumentation } from '../documentation/doc-generator';
import { formatAsMarkdown } from '../documentation/markdown-formatter';
import { createDocumentationError, DocumentationErrorType } from '../documentation/errors';
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

interface GenerateDocsOptions {
  output?: string;
  anthropicApiKey?: string;
  verbose?: boolean;
}

const program = new Command();

program
  .name('generate-docs')
  .description('Generate human-readable Markdown documentation from crawl results')
  .option('--output <file>', 'Save documentation to file instead of stdout')
  .option('--anthropic-api-key <key>', 'Anthropic API key for AI-generated page descriptions (overrides ANTHROPIC_API_KEY environment variable and config files)')
  .option('--verbose', 'Show detailed information including API key configuration guidance')
  .addHelpText('after', `
Examples:
  $ crawl https://example.com | generate-docs
  $ crawl https://example.com | generate-docs --output docs.md
  $ crawl https://example.com | generate-docs --anthropic-api-key your-api-key --output docs.md
  $ cat crawl-results.json | generate-docs

The documentation generator will:
  - Read crawl results JSON from stdin
  - Generate Markdown documentation describing site structure
  - Output to stdout or save to specified file
  - Handle empty results gracefully
  - Use AI-generated page descriptions if API key is provided (via --anthropic-api-key, ANTHROPIC_API_KEY environment variable, or config file at .testarion/config.json or ~/.testarion/config.json)

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
  .action(async (options: GenerateDocsOptions) => {
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

      // Generate documentation
      const documentation = await generateDocumentation(crawlResults, apiKey || undefined);

      // Format as Markdown
      const markdown = formatAsMarkdown(documentation);

      // Output results
      if (options.output) {
        const outputPath = path.resolve(options.output);
        
        // Check if file exists and warn if overwriting (per FR-019)
        if (fs.existsSync(outputPath)) {
          console.error(`Warning: Overwriting existing file: ${outputPath}`);
        }

        // Validate file is writable (per FR-016)
        try {
          // Try to write a test to check permissions
          fs.accessSync(path.dirname(outputPath), fs.constants.W_OK);
        } catch (error) {
          throw createDocumentationError(
            DocumentationErrorType.FILE_WRITE_ERROR,
            `Cannot write to ${outputPath}: ${error instanceof Error ? error.message : 'Permission denied'}`,
            error instanceof Error ? error : undefined,
          );
        }

        // Write file
        try {
          fs.writeFileSync(outputPath, markdown, 'utf-8');
        } catch (error) {
          throw createDocumentationError(
            DocumentationErrorType.FILE_WRITE_ERROR,
            `Failed to write file ${outputPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error instanceof Error ? error : undefined,
          );
        }
      } else {
        // Output to stdout
        process.stdout.write(markdown);
      }

      process.exit(0);
    } catch (error) {
      if (isAIError(error)) {
        console.error('Error:', error.toUserMessage());
        process.exit(1);
      }
      if (error instanceof Error && error.name === 'DocumentationError') {
        const docError = error as ReturnType<typeof createDocumentationError>;
        console.error('Error:', docError.toUserMessage());
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

