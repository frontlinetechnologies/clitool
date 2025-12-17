#!/usr/bin/env node
/**
 * CLI command for resetting AI system prompts to defaults.
 * Feature: 001-ai-system-prompts
 */

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import {
  initializePromptLoader,
  getPromptPaths,
  listPrompts,
  resetPrompt,
  promptExists,
} from '../prompts';

const program = new Command();

interface PromptStatus {
  name: string;
  hasUserPrompt: boolean;
  hasDefaultPrompt: boolean;
  status: 'user-modified' | 'using-default' | 'missing-default';
}

/**
 * Gets the status of all prompts.
 */
async function getPromptsStatus(): Promise<PromptStatus[]> {
  const names = await listPrompts();
  const statuses: PromptStatus[] = [];

  for (const name of names) {
    const paths = getPromptPaths(name);
    let hasUserPrompt = false;
    let hasDefaultPrompt = false;

    try {
      await fs.access(paths.userPath);
      hasUserPrompt = true;
    } catch {
      // User prompt doesn't exist
    }

    try {
      await fs.access(paths.defaultPath);
      hasDefaultPrompt = true;
    } catch {
      // Default prompt doesn't exist
    }

    let status: PromptStatus['status'];
    if (hasUserPrompt) {
      status = 'user-modified';
    } else if (hasDefaultPrompt) {
      status = 'using-default';
    } else {
      status = 'missing-default';
    }

    statuses.push({
      name,
      hasUserPrompt,
      hasDefaultPrompt,
      status,
    });
  }

  return statuses;
}

/**
 * Prompts user for confirmation (interactive mode).
 */
async function confirm(message: string): Promise<boolean> {
  // If stdin is not a TTY, skip confirmation
  if (!process.stdin.isTTY) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Lists all available prompts and their status.
 */
async function listPromptsCommand(verbose: boolean): Promise<void> {
  const statuses = await getPromptsStatus();

  if (statuses.length === 0) {
    console.error('No prompts found.');
    process.exit(1);
  }

  console.log('Available prompts:\n');

  let userModified = 0;
  let usingDefault = 0;

  for (const status of statuses) {
    const paths = getPromptPaths(status.name);

    console.log(`  ${status.name}`);
    console.log(`    Status: ${status.status}`);

    if (status.hasUserPrompt) {
      console.log(`    User:    ${verbose ? paths.userPath : `./${path.relative(process.cwd(), paths.userPath)}`}`);
      userModified++;
    }

    if (status.hasDefaultPrompt) {
      console.log(`    Default: ${verbose ? paths.defaultPath : `./${path.relative(process.cwd(), paths.defaultPath)}`}`);
      if (!status.hasUserPrompt) {
        usingDefault++;
      }
    }

    console.log('');
  }

  console.log(`Total: ${statuses.length} prompts (${userModified} user-modified, ${usingDefault} using-default)`);
}

/**
 * Resets a specific prompt to default.
 */
async function resetSinglePrompt(
  name: string,
  force: boolean,
  verbose: boolean
): Promise<void> {
  // Check if prompt exists
  const exists = await promptExists(name);
  if (!exists) {
    console.error(`Error: Unknown prompt '${name}'`);
    console.error('');
    console.error('Available prompts:');

    const prompts = await listPrompts();
    for (const p of prompts) {
      console.error(`  - ${p}`);
    }

    console.error('');
    console.error("Run 'testarion reset-prompts --list' to see all available prompts.");
    process.exit(1);
  }

  const paths = getPromptPaths(name);

  // Check if user prompt exists (needs overwrite confirmation)
  let needsConfirmation = false;
  try {
    await fs.access(paths.userPath);
    needsConfirmation = true;
  } catch {
    // No user prompt, no confirmation needed
  }

  // Check if default exists
  try {
    await fs.access(paths.defaultPath);
  } catch {
    console.error(`Error: Default prompt not found for '${name}'`);
    console.error('');
    console.error(`Expected location: ${paths.defaultPath}`);
    console.error('');
    console.error('This may indicate a corrupted installation. Try reinstalling the package.');
    process.exit(1);
  }

  if (needsConfirmation && !force) {
    const confirmed = await confirm(
      `Reset '${name}' to default? This will overwrite your customizations.`
    );
    if (!confirmed) {
      console.log('Reset cancelled. No changes made.');
      process.exit(0);
    }
  }

  if (verbose) {
    console.error(`[INFO] Copying ${paths.defaultPath} -> ${paths.userPath}`);
  }

  await resetPrompt(name);
  console.log(`\u2713 Reset ${name}`);
  console.log('');
  console.log(`Prompt '${name}' has been reset to default.`);
}

/**
 * Resets all prompts to defaults.
 */
async function resetAllPromptsCommand(force: boolean, verbose: boolean): Promise<void> {
  const statuses = await getPromptsStatus();
  const toReset = statuses.filter((s) => s.hasDefaultPrompt);

  if (toReset.length === 0) {
    console.error('No prompts available to reset.');
    process.exit(1);
  }

  const toOverwrite = toReset.filter((s) => s.hasUserPrompt);

  if (verbose) {
    const promptsDir = path.join(process.cwd(), 'prompts');
    const defaultsDir = path.join(promptsDir, 'defaults');
    console.error(`[INFO] Prompts directory: ${promptsDir}`);
    console.error(`[INFO] Defaults directory: ${defaultsDir}`);
  }

  if (toOverwrite.length > 0 && !force) {
    console.log('The following prompts will be reset to defaults:');
    for (const status of toReset) {
      const note = status.hasUserPrompt ? ' (overwrite existing)' : '';
      console.log(`  - ${status.name}${note}`);
    }
    console.log('');

    const confirmed = await confirm('This will overwrite your customizations. Continue?');
    if (!confirmed) {
      console.log('Reset cancelled. No changes made.');
      process.exit(0);
    }
    console.log('');
  }

  const reset: string[] = [];
  for (const status of toReset) {
    const paths = getPromptPaths(status.name);

    if (verbose) {
      console.error(
        `[DEBUG] Checking user prompt: ${paths.userPath} (${status.hasUserPrompt ? 'exists' : 'missing'})`
      );
      console.error(
        `[DEBUG] Checking default prompt: ${paths.defaultPath} (${status.hasDefaultPrompt ? 'exists' : 'missing'})`
      );
      console.error(`[INFO] Copying ${paths.defaultPath} -> ${paths.userPath}`);
    }

    await resetPrompt(status.name);
    console.log(`\u2713 Reset ${status.name}`);
    reset.push(status.name);
  }

  console.log('');
  console.log(`Successfully reset ${reset.length} prompt(s) to defaults.`);
}

program
  .name('reset-prompts')
  .description('Reset AI system prompts to their default values')
  .argument('[prompt-name]', 'Specific prompt to reset (e.g., page-analysis)')
  .option('-l, --list', 'List available prompts and their status')
  .option('-f, --force', 'Skip confirmation prompt for overwriting existing files')
  .option('-v, --verbose', 'Show detailed output including file paths')
  .action(async (promptName: string | undefined, options: {
    list?: boolean;
    force?: boolean;
    verbose?: boolean;
  }) => {
    try {
      // Initialize prompt loader
      initializePromptLoader({ verbose: options.verbose });

      if (options.list) {
        await listPromptsCommand(options.verbose || false);
        return;
      }

      if (promptName) {
        await resetSinglePrompt(promptName, options.force || false, options.verbose || false);
      } else {
        await resetAllPromptsCommand(options.force || false, options.verbose || false);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
        if (options.verbose && error.stack) {
          console.error(error.stack);
        }
      } else {
        console.error('An unexpected error occurred');
      }
      process.exit(1);
    }
  });

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export { program };
