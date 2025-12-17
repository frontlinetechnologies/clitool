#!/usr/bin/env node
/**
 * Unified CLI entry point for testarion.
 * Provides subcommands: crawl, generate-docs, generate-tests, reset-prompts
 */

import { Command } from 'commander';
import { program as crawlProgram } from './crawl';
import { program as generateDocsProgram } from './generate-docs';
import { program as generateTestsProgram } from './generate-tests';
import { program as resetPromptsProgram } from './reset-prompts';

const program = new Command();

program
  .name('testarion')
  .description('AI-powered E2E testing CLI tool')
  .version('0.1.0');

program.addCommand(crawlProgram);
program.addCommand(generateDocsProgram);
program.addCommand(generateTestsProgram);
program.addCommand(resetPromptsProgram);

program.parse();
