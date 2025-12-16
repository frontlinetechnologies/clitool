#!/usr/bin/env node

/**
 * CLI command for crawling web applications.
 * Entry point for the crawl command.
 */

import { Command } from 'commander';
import { Crawler } from '../crawler/crawler';
import { validateURL } from '../utils/url-validator';
import { setupSignalHandlers } from '../utils/signals';
import { formatAsJSON } from '../output/json-formatter';
import { formatAsText } from '../output/text-formatter';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('crawl')
  .description('Crawl a web application to discover pages, forms, buttons, and input fields')
  .argument('<url>', 'URL to start crawling from (must start with http:// or https://)')
  .option('--quiet', 'Suppress progress updates (useful for scripting)', false)
  .option('--format <format>', 'Output format: json or text (default: json)', 'json')
  .option('--verbose', 'Include detailed information about each page and element', false)
  .option('--rate-limit <seconds>', 'Delay between requests in seconds (default: 1.5)', '1.5')
  .option('--output <file>', 'Save results to file instead of stdout')
  .addHelpText('after', `
Examples:
  $ crawl https://example.com
  $ crawl https://example.com --format text
  $ crawl https://example.com --quiet --output results.json
  $ crawl https://example.com --verbose --rate-limit 2.0

The crawler will:
  - Discover all accessible pages starting from the provided URL
  - Identify forms, buttons, and input fields on each page
  - Respect robots.txt rules
  - Implement rate limiting to avoid overwhelming servers
  - Output results in JSON or human-readable text format

Press Ctrl+C to interrupt the crawl gracefully. Partial results will be saved.
  `)
  .action(async (url: string, options) => {
    try {
      // Validate URL
      validateURL(url);

      // Set up signal handlers
      setupSignalHandlers();

      // Parse rate limit
      const rateLimit = parseFloat(options.rateLimit);
      if (isNaN(rateLimit) || rateLimit < 0) {
        console.error('Error: --rate-limit must be a positive number');
        process.exit(1);
      }

      // Create crawler with rate limiting
      const crawler = new Crawler(url, options.quiet, rateLimit);

      // Perform crawl
      const results = await crawler.crawl();

      // Format output
      let output: string;
      if (options.format === 'text') {
        output = formatAsText(results);
      } else {
        output = formatAsJSON(results, options.verbose);
      }

      // Output results
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, output, 'utf-8');
        if (!options.quiet) {
          console.log(`\nResults saved to: ${outputPath}`);
        }
      } else {
        console.log(output);
      }

      // Exit with appropriate code
      if (results.summary.interrupted) {
        process.exit(130);
      } else if (results.summary.errors > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export { program };

