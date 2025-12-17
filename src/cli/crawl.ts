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

interface CrawlOptions {
  quiet: boolean;
  format: string;
  verbose: boolean;
  rateLimit: string;
  output?: string;
  maxPages?: string;
  maxDepth?: string;
  include?: string[];
  exclude?: string[];
}

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
  .option('--max-pages <n>', 'Maximum number of pages to crawl')
  .option('--max-depth <n>', 'Maximum link depth from start URL (0 = start page only)')
  .option('--include <pattern...>', 'Only crawl URLs matching these patterns (glob or /regex/)')
  .option('--exclude <pattern...>', 'Skip URLs matching these patterns (glob or /regex/)')
  .addHelpText('after', `
Examples:
  $ testarion crawl https://example.com
  $ testarion crawl https://example.com --format text
  $ testarion crawl https://example.com --quiet --output results.json
  $ testarion crawl https://example.com --verbose --rate-limit 2.0
  $ testarion crawl https://example.com --max-pages 50 --max-depth 3
  $ testarion crawl https://example.com --include "**/products/**" --exclude "**/admin/**"
  $ testarion crawl https://example.com --include "/\\/api\\//" --max-pages 100

The crawler will:
  - Discover all accessible pages starting from the provided URL
  - Identify forms, buttons, and input fields on each page
  - Respect robots.txt rules
  - Implement rate limiting to avoid overwhelming servers
  - Output results in JSON or human-readable text format
  - Stop when limits are reached (--max-pages, --max-depth)
  - Filter URLs using include/exclude patterns (glob or /regex/)

Press Ctrl+C to interrupt the crawl gracefully. Partial results will be saved.
  `)
  .action(async (url: string, options: CrawlOptions) => {
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

      // Parse maxPages
      let maxPages: number | undefined;
      if (options.maxPages) {
        maxPages = parseInt(options.maxPages, 10);
        if (isNaN(maxPages) || maxPages < 1) {
          console.error('Error: --max-pages must be a positive integer');
          process.exit(1);
        }
      }

      // Parse maxDepth
      let maxDepth: number | undefined;
      if (options.maxDepth) {
        maxDepth = parseInt(options.maxDepth, 10);
        if (isNaN(maxDepth) || maxDepth < 0) {
          console.error('Error: --max-depth must be a non-negative integer');
          process.exit(1);
        }
      }

      // Create crawler with rate limiting and config
      const crawler = new Crawler(url, options.quiet, rateLimit, {
        maxPages,
        maxDepth,
        includePatterns: options.include,
        excludePatterns: options.exclude,
      });

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

