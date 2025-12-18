/**
 * Storage-state authentication method.
 * Applies pre-existing Playwright storage state for session injection.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BrowserContext } from 'playwright';
import type { StorageState } from '../../models/role';
import { StorageStateNotFoundError, AuthenticationError } from '../errors';

/**
 * Storage state method configuration.
 */
export interface StorageStateConfig {
  /** Path to storage state file */
  path: string;
}

/**
 * Storage-state authentication method.
 * Applies pre-existing session state instead of logging in.
 */
export class StorageStateMethod {
  /**
   * Applies storage state to a browser context.
   * @param context - Browser context to modify
   * @param config - Storage state configuration
   * @returns true if state was applied successfully
   */
  async apply(context: BrowserContext, config: StorageStateConfig): Promise<boolean> {
    const statePath = path.resolve(config.path);

    // Check if file exists
    if (!fs.existsSync(statePath)) {
      throw new StorageStateNotFoundError(statePath);
    }

    try {
      // Read and parse storage state
      const stateContent = fs.readFileSync(statePath, 'utf-8');
      const storageState = JSON.parse(stateContent) as StorageState;

      // Apply cookies to context
      if (storageState.cookies && storageState.cookies.length > 0) {
        await context.addCookies(storageState.cookies);
      }

      return true;
    } catch (error) {
      if (error instanceof StorageStateNotFoundError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new AuthenticationError(
          `Invalid storage state file: ${statePath}`,
          'storage-state',
          error,
        );
      }

      throw new AuthenticationError(
        `Failed to apply storage state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'storage-state',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Saves the current browser context state to a file.
   * @param context - Browser context to save
   * @param outputPath - Path to save state to
   */
  async save(context: BrowserContext, outputPath: string): Promise<void> {
    const resolvedPath = path.resolve(outputPath);
    const dirPath = path.dirname(resolvedPath);

    try {
      // Create directory if needed
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
      }

      // Get storage state from context
      const storageState = await context.storageState();

      // Write to file
      fs.writeFileSync(resolvedPath, JSON.stringify(storageState, null, 2), 'utf-8');

      // Set file permissions to 0o600 (owner read/write only)
      fs.chmodSync(resolvedPath, 0o600);
    } catch (error) {
      throw new AuthenticationError(
        `Failed to save storage state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'storage-state',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Validates that a storage state file is valid.
   * @param statePath - Path to storage state file
   * @returns true if valid, false otherwise
   */
  validate(statePath: string): boolean {
    const resolvedPath = path.resolve(statePath);

    if (!fs.existsSync(resolvedPath)) {
      return false;
    }

    try {
      const content = fs.readFileSync(resolvedPath, 'utf-8');
      const state = JSON.parse(content) as StorageState;

      // Basic validation - should have cookies or origins array
      return (
        (Array.isArray(state.cookies) || Array.isArray(state.origins))
      );
    } catch {
      return false;
    }
  }
}

/**
 * Creates a StorageStateMethod instance.
 */
export function createStorageStateMethod(): StorageStateMethod {
  return new StorageStateMethod();
}
