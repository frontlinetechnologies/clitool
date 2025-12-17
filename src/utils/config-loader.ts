/**
 * Configuration file loader for API key resolution.
 * Handles reading/writing config files and resolving API keys from multiple sources.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Configuration file structure.
 */
export interface ConfigFile {
  anthropicApiKey?: string;
  // Other fields may exist but are ignored by this feature
}

/**
 * Error class for configuration-related errors.
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly filePath?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Module-level state for prompt tracking.
 * Tracks if save prompt has been shown this session.
 */
let promptShownThisSession = false;

/**
 * Resets the prompt shown state (for testing purposes).
 */
export function resetPromptState(): void {
  promptShownThisSession = false;
}

/**
 * Gets the prompt shown state (for testing purposes).
 */
export function getPromptShownState(): boolean {
  return promptShownThisSession;
}

/**
 * Sets the prompt shown state.
 */
export function setPromptShownState(shown: boolean): void {
  promptShownThisSession = shown;
}

/**
 * Gets the absolute path to project-level config file.
 * @returns Absolute path to .testarion/config.json in current working directory
 */
export function getProjectConfigPath(): string {
  return path.join(process.cwd(), '.testarion', 'config.json');
}

/**
 * Gets the absolute path to global config file.
 * @returns Absolute path to ~/.testarion/config.json in user home directory
 */
export function getGlobalConfigPath(): string {
  return path.join(os.homedir(), '.testarion', 'config.json');
}

/**
 * Validates API key format.
 * Anthropic API keys start with 'sk-ant-' prefix.
 *
 * @param key - API key to validate
 * @returns true if format is valid, false otherwise
 */
export function validateApiKeyFormat(key: string): boolean {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    return false;
  }
  return trimmedKey.startsWith('sk-ant-');
}

/**
 * Reads and parses a configuration file.
 *
 * @param filePath - Absolute path to config file
 * @returns Parsed config object or null if file doesn't exist
 * @throws ConfigError if file exists but contains invalid JSON
 */
export function readConfigFile(filePath: string): ConfigFile | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content) as ConfigFile;

    // Trim whitespace from anthropicApiKey if present
    if (config.anthropicApiKey && typeof config.anthropicApiKey === 'string') {
      config.anthropicApiKey = config.anthropicApiKey.trim();
    }

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigError(
        `Invalid JSON in config file: ${error.message}`,
        filePath,
        error,
      );
    }
    throw new ConfigError(
      `Cannot read config file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      filePath,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Writes API key to a configuration file.
 * Creates parent directory if needed, preserves other fields if file exists.
 *
 * @param filePath - Absolute path to config file
 * @param apiKey - API key to save
 * @throws ConfigError if directory creation, file write, or permission setting fails
 */
export function writeConfigFile(filePath: string, apiKey: string): void {
  try {
    const dirPath = path.dirname(filePath);

    // Create directory if needed
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
    }

    // Read existing config if exists (preserve other fields)
    let existingConfig: ConfigFile = {};
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        existingConfig = JSON.parse(content) as ConfigFile;
      }
    } catch {
      // Ignore parse errors - we'll overwrite the file
      existingConfig = {};
    }

    // Update anthropicApiKey field
    existingConfig.anthropicApiKey = apiKey.trim();

    // Write JSON to file
    fs.writeFileSync(filePath, JSON.stringify(existingConfig, null, 2) + '\n', 'utf-8');

    // Set file permissions to 0o600 (owner read/write only)
    fs.chmodSync(filePath, 0o600);

    // Set directory permissions to 0o700 (owner read/write/execute only)
    try {
      fs.chmodSync(dirPath, 0o700);
    } catch {
      // Ignore directory permission errors - file is already secured
    }
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(
      `Cannot write config file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      filePath,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Resolves API key from all available sources in priority order.
 *
 * Priority order:
 * 1. CLI parameter (cliKey)
 * 2. Environment variable (ANTHROPIC_API_KEY)
 * 3. Project config file (.testarion/config.json)
 * 4. Global config file (~/.testarion/config.json)
 *
 * @param cliKey - Optional API key provided via CLI parameter
 * @returns Resolved API key (trimmed, validated) or null if no key found
 * @throws ConfigError if key format is invalid (after resolution)
 */
export function resolveApiKey(cliKey?: string): string | null {
  // 1. Check CLI parameter
  if (cliKey) {
    const trimmedKey = cliKey.trim();
    if (trimmedKey) {
      if (!validateApiKeyFormat(trimmedKey)) {
        throw new ConfigError("Invalid API key format. Anthropic keys start with 'sk-ant-'.");
      }
      return trimmedKey;
    }
  }

  // 2. Check environment variable
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) {
    const trimmedKey = envKey.trim();
    if (trimmedKey) {
      if (!validateApiKeyFormat(trimmedKey)) {
        throw new ConfigError("Invalid API key format. Anthropic keys start with 'sk-ant-'.");
      }
      return trimmedKey;
    }
  }

  // 3. Check project config file
  try {
    const projectConfig = readConfigFile(getProjectConfigPath());
    if (projectConfig?.anthropicApiKey) {
      const trimmedKey = projectConfig.anthropicApiKey.trim();
      if (trimmedKey) {
        if (!validateApiKeyFormat(trimmedKey)) {
          throw new ConfigError(
            "Invalid API key format in project config. Anthropic keys start with 'sk-ant-'.",
            getProjectConfigPath(),
          );
        }
        return trimmedKey;
      }
    }
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    // Ignore read errors - continue to next source
  }

  // 4. Check global config file
  try {
    const globalConfig = readConfigFile(getGlobalConfigPath());
    if (globalConfig?.anthropicApiKey) {
      const trimmedKey = globalConfig.anthropicApiKey.trim();
      if (trimmedKey) {
        if (!validateApiKeyFormat(trimmedKey)) {
          throw new ConfigError(
            "Invalid API key format in global config. Anthropic keys start with 'sk-ant-'.",
            getGlobalConfigPath(),
          );
        }
        return trimmedKey;
      }
    }
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    // Ignore read errors - return null
  }

  // No key found
  return null;
}

/**
 * Determines if save prompt should be shown.
 *
 * @param cliKey - API key from CLI parameter
 * @param envKey - API key from environment variable
 * @returns true if prompt should be shown, false otherwise
 */
export function shouldPromptToSave(cliKey?: string, envKey?: string): boolean {
  // Must have a key provided via CLI or env var
  const hasProvidedKey = !!(cliKey?.trim() || envKey?.trim());
  if (!hasProvidedKey) {
    return false;
  }

  // Must not have already shown prompt this session
  if (promptShownThisSession) {
    return false;
  }

  // Must not have existing config files
  const projectConfigExists = fs.existsSync(getProjectConfigPath());
  const globalConfigExists = fs.existsSync(getGlobalConfigPath());

  if (projectConfigExists || globalConfigExists) {
    return false;
  }

  return true;
}
