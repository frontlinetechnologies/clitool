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
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('generate-docs')
  .description('Generate human-readable Markdown documentation from crawl results')
  .option('--output <file>', 'Save documentation to file instead of stdout')
  .addHelpText('after', `
Examples:
  $ crawl https://example.com | generate-docs
  $ crawl https://example.com | generate-docs --output docs.md
  $ cat crawl-results.json | generate-docs

The documentation generator will:
  - Read crawl results JSON from stdin
  - Generate Markdown documentation describing site structure
  - Output to stdout or save to specified file
  - Handle empty results gracefully

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

      // Generate documentation
      const documentation = await generateDocumentation(crawlResults);

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
      if (error instanceof Error && error.name === 'DocumentationError') {
        const docError = error as ReturnType<typeof createDocumentationError>;
        console.error('Error:', docError.toUserMessage());
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

