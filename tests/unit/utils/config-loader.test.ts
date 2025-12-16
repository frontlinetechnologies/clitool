/**
 * Unit tests for config-loader module.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ConfigError,
  getProjectConfigPath,
  getGlobalConfigPath,
  validateApiKeyFormat,
  readConfigFile,
  writeConfigFile,
  resolveApiKey,
  shouldPromptToSave,
  resetPromptState,
  setPromptShownState,
  getPromptShownState,
} from '../../../src/utils/config-loader';

// Mock fs module for controlled testing
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock os module for home directory
jest.mock('os');
const mockOs = os as jest.Mocked<typeof os>;

describe('config-loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPromptState();
    // Reset environment variable
    delete process.env.ANTHROPIC_API_KEY;

    // Default mock for os.homedir
    mockOs.homedir.mockReturnValue('/home/testuser');
  });

  describe('getProjectConfigPath', () => {
    it('should return absolute path to project config file', () => {
      const result = getProjectConfigPath();
      expect(result).toBe(path.join(process.cwd(), '.testarion', 'config.json'));
    });

    it('should use current working directory', () => {
      const result = getProjectConfigPath();
      expect(result).toContain('.testarion');
      expect(result).toContain('config.json');
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('getGlobalConfigPath', () => {
    it('should return absolute path to global config file', () => {
      const result = getGlobalConfigPath();
      expect(result).toBe(path.join('/home/testuser', '.testarion', 'config.json'));
    });

    it('should use home directory from os.homedir()', () => {
      mockOs.homedir.mockReturnValue('/custom/home');
      const result = getGlobalConfigPath();
      expect(result).toBe(path.join('/custom/home', '.testarion', 'config.json'));
    });
  });

  describe('validateApiKeyFormat', () => {
    it('should return true for valid API key with sk-ant- prefix', () => {
      expect(validateApiKeyFormat('sk-ant-api03-xxxx')).toBe(true);
    });

    it('should return true for key with leading/trailing whitespace (trims)', () => {
      expect(validateApiKeyFormat('  sk-ant-api03-xxxx  ')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(validateApiKeyFormat('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(validateApiKeyFormat('   ')).toBe(false);
    });

    it('should return false for key without sk-ant- prefix', () => {
      expect(validateApiKeyFormat('invalid-key')).toBe(false);
    });

    it('should return false for key with similar but wrong prefix', () => {
      expect(validateApiKeyFormat('sk-api-xxxx')).toBe(false);
      expect(validateApiKeyFormat('sk-anthropic-xxxx')).toBe(false);
    });

    it('should return false for partial prefix', () => {
      expect(validateApiKeyFormat('sk-ant')).toBe(false);
      expect(validateApiKeyFormat('sk-an')).toBe(false);
    });
  });

  describe('readConfigFile', () => {
    it('should return null if file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = readConfigFile('/path/to/config.json');

      expect(result).toBeNull();
    });

    it('should parse valid config file and return ConfigFile', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"anthropicApiKey": "sk-ant-api03-xxxx"}');

      const result = readConfigFile('/path/to/config.json');

      expect(result).toEqual({ anthropicApiKey: 'sk-ant-api03-xxxx' });
    });

    it('should trim whitespace from API key', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"anthropicApiKey": "  sk-ant-api03-xxxx  "}');

      const result = readConfigFile('/path/to/config.json');

      expect(result?.anthropicApiKey).toBe('sk-ant-api03-xxxx');
    });

    it('should throw ConfigError for invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json {');

      expect(() => readConfigFile('/path/to/config.json')).toThrow(ConfigError);
      expect(() => readConfigFile('/path/to/config.json')).toThrow(/Invalid JSON/);
    });

    it('should include file path in ConfigError', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      try {
        readConfigFile('/path/to/config.json');
        fail('Expected ConfigError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigError);
        expect((error as ConfigError).filePath).toBe('/path/to/config.json');
      }
    });

    it('should handle missing anthropicApiKey field gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"otherField": "value"}');

      const result = readConfigFile('/path/to/config.json');

      expect(result).toEqual({ otherField: 'value' });
      expect(result?.anthropicApiKey).toBeUndefined();
    });
  });

  describe('writeConfigFile', () => {
    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);
      mockFs.chmodSync.mockReturnValue(undefined);

      writeConfigFile('/path/to/.testarion/config.json', 'sk-ant-api03-xxxx');

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        '/path/to/.testarion',
        expect.objectContaining({ recursive: true, mode: 0o700 })
      );
    });

    it('should preserve other fields when updating existing config', () => {
      mockFs.existsSync.mockImplementation((p) => p === '/path/to/.testarion/config.json');
      mockFs.readFileSync.mockReturnValue('{"otherField": "value", "anthropicApiKey": "old-key"}');
      mockFs.writeFileSync.mockReturnValue(undefined);
      mockFs.chmodSync.mockReturnValue(undefined);

      writeConfigFile('/path/to/.testarion/config.json', 'sk-ant-api03-new');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/path/to/.testarion/config.json',
        expect.stringContaining('"otherField": "value"'),
        'utf-8'
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/path/to/.testarion/config.json',
        expect.stringContaining('"anthropicApiKey": "sk-ant-api03-new"'),
        'utf-8'
      );
    });

    it('should set file permissions to 0o600', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);
      mockFs.chmodSync.mockReturnValue(undefined);

      writeConfigFile('/path/to/.testarion/config.json', 'sk-ant-api03-xxxx');

      expect(mockFs.chmodSync).toHaveBeenCalledWith(
        '/path/to/.testarion/config.json',
        0o600
      );
    });

    it('should trim whitespace from API key before saving', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);
      mockFs.chmodSync.mockReturnValue(undefined);

      writeConfigFile('/path/to/config.json', '  sk-ant-api03-xxxx  ');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"anthropicApiKey": "sk-ant-api03-xxxx"'),
        'utf-8'
      );
    });

    it('should throw ConfigError on write failure', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => writeConfigFile('/path/to/config.json', 'sk-ant-api03-xxxx'))
        .toThrow(ConfigError);
    });
  });

  describe('resolveApiKey', () => {
    it('should return CLI key first (highest priority)', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"anthropicApiKey": "sk-ant-config-key"}');

      const result = resolveApiKey('sk-ant-cli-key');

      expect(result).toBe('sk-ant-cli-key');
    });

    it('should return env var second if no CLI key', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"anthropicApiKey": "sk-ant-config-key"}');

      const result = resolveApiKey();

      expect(result).toBe('sk-ant-env-key');
    });

    it('should return project config third if no CLI or env key', () => {
      delete process.env.ANTHROPIC_API_KEY;
      mockFs.existsSync.mockImplementation((p) =>
        p === path.join(process.cwd(), '.testarion', 'config.json')
      );
      mockFs.readFileSync.mockReturnValue('{"anthropicApiKey": "sk-ant-project-key"}');

      const result = resolveApiKey();

      expect(result).toBe('sk-ant-project-key');
    });

    it('should return global config fourth if no other sources', () => {
      delete process.env.ANTHROPIC_API_KEY;
      mockFs.existsSync.mockImplementation((p) =>
        p === path.join('/home/testuser', '.testarion', 'config.json')
      );
      mockFs.readFileSync.mockReturnValue('{"anthropicApiKey": "sk-ant-global-key"}');

      const result = resolveApiKey();

      expect(result).toBe('sk-ant-global-key');
    });

    it('should return null if no key found in any source', () => {
      delete process.env.ANTHROPIC_API_KEY;
      mockFs.existsSync.mockReturnValue(false);

      const result = resolveApiKey();

      expect(result).toBeNull();
    });

    it('should trim whitespace from all sources', () => {
      const result = resolveApiKey('  sk-ant-cli-key  ');
      expect(result).toBe('sk-ant-cli-key');
    });

    it('should skip empty CLI key and check env var', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';

      const result = resolveApiKey('   ');

      expect(result).toBe('sk-ant-env-key');
    });

    it('should throw ConfigError for invalid format in CLI key', () => {
      expect(() => resolveApiKey('invalid-key')).toThrow(ConfigError);
      expect(() => resolveApiKey('invalid-key')).toThrow(/sk-ant-/);
    });

    it('should throw ConfigError for invalid format in env var', () => {
      process.env.ANTHROPIC_API_KEY = 'invalid-env-key';

      expect(() => resolveApiKey()).toThrow(ConfigError);
    });

    it('should throw ConfigError for invalid format in config file', () => {
      delete process.env.ANTHROPIC_API_KEY;
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"anthropicApiKey": "invalid-config-key"}');

      expect(() => resolveApiKey()).toThrow(ConfigError);
    });
  });

  describe('shouldPromptToSave', () => {
    beforeEach(() => {
      resetPromptState();
    });

    it('should return true when CLI key provided and no config files exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = shouldPromptToSave('sk-ant-cli-key');

      expect(result).toBe(true);
    });

    it('should return true when env key provided and no config files exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = shouldPromptToSave(undefined, 'sk-ant-env-key');

      expect(result).toBe(true);
    });

    it('should return false when no key provided', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = shouldPromptToSave();

      expect(result).toBe(false);
    });

    it('should return false when project config exists', () => {
      mockFs.existsSync.mockImplementation((p) =>
        typeof p === 'string' && p.includes('.testarion') && !p.includes('/home/')
      );

      const result = shouldPromptToSave('sk-ant-cli-key');

      expect(result).toBe(false);
    });

    it('should return false when global config exists', () => {
      mockFs.existsSync.mockImplementation((p) =>
        typeof p === 'string' && p.includes('/home/')
      );

      const result = shouldPromptToSave('sk-ant-cli-key');

      expect(result).toBe(false);
    });

    it('should return false when prompt already shown this session', () => {
      mockFs.existsSync.mockReturnValue(false);
      setPromptShownState(true);

      const result = shouldPromptToSave('sk-ant-cli-key');

      expect(result).toBe(false);
    });

    it('should return false for empty/whitespace key', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(shouldPromptToSave('   ')).toBe(false);
      expect(shouldPromptToSave('')).toBe(false);
    });
  });

  describe('prompt state management', () => {
    it('should start with promptShownThisSession = false', () => {
      resetPromptState();
      expect(getPromptShownState()).toBe(false);
    });

    it('should track prompt shown state', () => {
      resetPromptState();
      expect(getPromptShownState()).toBe(false);

      setPromptShownState(true);
      expect(getPromptShownState()).toBe(true);

      resetPromptState();
      expect(getPromptShownState()).toBe(false);
    });
  });

  describe('ConfigError', () => {
    it('should create error with message', () => {
      const error = new ConfigError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('ConfigError');
    });

    it('should include file path when provided', () => {
      const error = new ConfigError('Test error', '/path/to/file');

      expect(error.filePath).toBe('/path/to/file');
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new ConfigError('Test error', '/path/to/file', cause);

      expect(error.cause).toBe(cause);
    });

    it('should be instance of Error', () => {
      const error = new ConfigError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ConfigError);
    });
  });
});
