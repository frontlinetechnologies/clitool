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
import {
  createAuthenticator,
  createAuthConfigFromCLI,
  loadAuthConfig,
} from '../auth';
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
  // Authentication options
  authConfig?: string;
  authRole?: string;
  loginUrl?: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  authSuccessUrl?: string;
  authSuccessSelector?: string;
  authSuccessCookie?: string;
  storageState?: string;
  skipUnauthenticated?: boolean;
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
  // Authentication options
  .option('--auth-config <path>', 'Path to authentication config file (JSON)')
  .option('--auth-role <name>', 'Single role to crawl as (requires credentials in env)')
  .option('--login-url <url>', 'Login page URL for form-based auth')
  .option('--username-selector <selector>', 'CSS selector for username/email field')
  .option('--password-selector <selector>', 'CSS selector for password field')
  .option('--submit-selector <selector>', 'CSS selector for submit button')
  .option('--auth-success-url <pattern>', 'URL pattern indicating successful login')
  .option('--auth-success-selector <selector>', 'CSS selector indicating successful login')
  .option('--auth-success-cookie <name>', 'Cookie name indicating successful login')
  .option('--storage-state <path>', 'Playwright storage state file for session injection')
  .option('--skip-unauthenticated', 'Skip unauthenticated baseline crawl')
  .addHelpText('after', `
Examples:
  $ testarion crawl https://example.com
  $ testarion crawl https://example.com --format text
  $ testarion crawl https://example.com --quiet --output results.json
  $ testarion crawl https://example.com --verbose --rate-limit 2.0
  $ testarion crawl https://example.com --max-pages 50 --max-depth 3
  $ testarion crawl https://example.com --include "**/products/**" --exclude "**/admin/**"
  $ testarion crawl https://example.com --include "/\\/api\\//" --max-pages 100

Authentication examples:
  $ testarion crawl https://example.com --auth-role admin --login-url https://example.com/login
  $ testarion crawl https://example.com --auth-config ./testarion.auth.json
  $ testarion crawl https://example.com --storage-state ./auth-state.json

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

      // Handle authentication if auth options are provided
      if (options.authConfig || options.authRole || options.storageState) {
        const { chromium } = await import('playwright');
        const browser = await chromium.launch();

        try {
          let authConfig;
          let roleName = options.authRole || 'authenticated';

          if (options.authConfig) {
            // Load auth config from file
            authConfig = await loadAuthConfig(options.authConfig);
          } else if (options.authRole) {
            // Create auth config from CLI options
            authConfig = createAuthConfigFromCLI({
              authRole: options.authRole,
              loginUrl: options.loginUrl,
              usernameSelector: options.usernameSelector,
              passwordSelector: options.passwordSelector,
              submitSelector: options.submitSelector,
              authSuccessUrl: options.authSuccessUrl,
              authSuccessSelector: options.authSuccessSelector,
              authSuccessCookie: options.authSuccessCookie,
            });
          }

          if (authConfig) {
            const authenticator = createAuthenticator(authConfig, browser);

            try {
              const context = await authenticator.authenticate(roleName);
              crawler.setAuthContext(context, roleName);
              if (!options.quiet) {
                console.error(`Authenticated as: ${roleName}`);
              }
            } catch (authError) {
              console.error('Authentication error:', authError instanceof Error ? authError.message : authError);
              if (!options.quiet) {
                console.error('Continuing with unauthenticated crawl...');
              }
            }
          }
        } catch (setupError) {
          console.error('Auth setup error:', setupError instanceof Error ? setupError.message : setupError);
        }
      }

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

