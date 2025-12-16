/**
 * Integration tests for config file scenarios.
 * These tests use real file system operations in a temporary directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  readConfigFile,
  writeConfigFile,
  resolveApiKey,
  ConfigError,
  resetPromptState,
  shouldPromptToSave,
} from '../../src/utils/config-loader';

describe('Config File Integration Tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'testarion-test-'));

    // Save original values
    originalCwd = process.cwd();
    originalEnv = process.env.ANTHROPIC_API_KEY;

    // Change to temp directory
    process.chdir(tempDir);

    // Clear environment variable
    delete process.env.ANTHROPIC_API_KEY;

    // Reset prompt state
    resetPromptState();
  });

  afterEach(() => {
    // Restore original values
    process.chdir(originalCwd);
    if (originalEnv !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalEnv;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('readConfigFile with real files', () => {
    it('should read valid config file', () => {
      const configDir = path.join(tempDir, '.testarion');
      fs.mkdirSync(configDir, { recursive: true });
      const configPath = path.join(configDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ anthropicApiKey: 'sk-ant-test-key' }));

      const result = readConfigFile(configPath);

      expect(result).toEqual({ anthropicApiKey: 'sk-ant-test-key' });
    });

    it('should return null for non-existent file', () => {
      const result = readConfigFile(path.join(tempDir, 'nonexistent.json'));

      expect(result).toBeNull();
    });

    it('should throw ConfigError for invalid JSON', () => {
      const configPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(configPath, 'not valid json {');

      expect(() => readConfigFile(configPath)).toThrow(ConfigError);
    });

    it('should trim whitespace from API key', () => {
      const configPath = path.join(tempDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ anthropicApiKey: '  sk-ant-test-key  ' }));

      const result = readConfigFile(configPath);

      expect(result?.anthropicApiKey).toBe('sk-ant-test-key');
    });
  });

  describe('writeConfigFile with real files', () => {
    it('should create config file with proper permissions', () => {
      const configDir = path.join(tempDir, '.testarion');
      const configPath = path.join(configDir, 'config.json');

      writeConfigFile(configPath, 'sk-ant-test-key');

      // Verify file was created
      expect(fs.existsSync(configPath)).toBe(true);

      // Verify content
      const content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(content.anthropicApiKey).toBe('sk-ant-test-key');

      // Verify permissions (owner read/write only)
      const stats = fs.statSync(configPath);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o600);
    });

    it('should create directory if it does not exist', () => {
      const configDir = path.join(tempDir, 'new-dir', '.testarion');
      const configPath = path.join(configDir, 'config.json');

      writeConfigFile(configPath, 'sk-ant-test-key');

      expect(fs.existsSync(configDir)).toBe(true);
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should preserve other fields when updating', () => {
      const configDir = path.join(tempDir, '.testarion');
      fs.mkdirSync(configDir, { recursive: true });
      const configPath = path.join(configDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        otherField: 'preserved',
        anthropicApiKey: 'sk-ant-old-key',
      }));

      writeConfigFile(configPath, 'sk-ant-new-key');

      const content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(content.otherField).toBe('preserved');
      expect(content.anthropicApiKey).toBe('sk-ant-new-key');
    });
  });

  describe('resolveApiKey priority order', () => {
    it('should prioritize CLI over env var', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';

      const result = resolveApiKey('sk-ant-cli-key');

      expect(result).toBe('sk-ant-cli-key');
    });

    it('should prioritize env var over config file', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';

      // Create project config file
      const configDir = path.join(tempDir, '.testarion');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify({ anthropicApiKey: 'sk-ant-config-key' })
      );

      const result = resolveApiKey();

      expect(result).toBe('sk-ant-env-key');
    });

    it('should use project config when no CLI or env var', () => {
      // Create project config file
      const configDir = path.join(tempDir, '.testarion');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify({ anthropicApiKey: 'sk-ant-project-key' })
      );

      const result = resolveApiKey();

      expect(result).toBe('sk-ant-project-key');
    });

    it('should return null when no key found anywhere', () => {
      const result = resolveApiKey();

      expect(result).toBeNull();
    });
  });

  describe('config file error handling', () => {
    it('should handle syntax errors in config file gracefully', () => {
      const configDir = path.join(tempDir, '.testarion');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        'not valid json {'
      );

      expect(() => resolveApiKey()).toThrow(ConfigError);
    });

    it('should include file location in error message', () => {
      const configDir = path.join(tempDir, '.testarion');
      fs.mkdirSync(configDir, { recursive: true });
      const configPath = path.join(configDir, 'config.json');
      fs.writeFileSync(configPath, 'not valid json');

      try {
        readConfigFile(configPath);
        fail('Expected ConfigError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigError);
        expect((error as ConfigError).filePath).toBe(configPath);
      }
    });

    it('should handle missing config file gracefully', () => {
      // No config files exist, should return null without error
      const result = resolveApiKey();

      expect(result).toBeNull();
    });
  });

  describe('format validation in resolveApiKey', () => {
    it('should throw ConfigError for invalid CLI key format', () => {
      expect(() => resolveApiKey('invalid-key')).toThrow(ConfigError);
      expect(() => resolveApiKey('invalid-key')).toThrow(/sk-ant-/);
    });

    it('should throw ConfigError for invalid env var key format', () => {
      process.env.ANTHROPIC_API_KEY = 'invalid-env-key';

      expect(() => resolveApiKey()).toThrow(ConfigError);
    });

    it('should throw ConfigError for invalid config file key format', () => {
      const configDir = path.join(tempDir, '.testarion');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify({ anthropicApiKey: 'invalid-config-key' })
      );

      expect(() => resolveApiKey()).toThrow(ConfigError);
    });
  });

  describe('shouldPromptToSave', () => {
    it('should return true when CLI key provided and no config exists', () => {
      const result = shouldPromptToSave('sk-ant-cli-key');

      expect(result).toBe(true);
    });

    it('should return false when project config exists', () => {
      const configDir = path.join(tempDir, '.testarion');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.json'),
        JSON.stringify({ anthropicApiKey: 'sk-ant-existing' })
      );

      const result = shouldPromptToSave('sk-ant-cli-key');

      expect(result).toBe(false);
    });
  });
});
