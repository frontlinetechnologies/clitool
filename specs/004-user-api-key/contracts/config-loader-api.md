# API Contract: Config Loader Module

**Feature**: Provide Own AI API Key  
**Date**: 2025-01-16  
**Module**: `src/utils/config-loader.ts`

## Overview

The config loader module provides functions for reading, writing, and resolving API keys from multiple sources (CLI parameter, environment variable, project config file, global config file).

## Public API

### `resolveApiKey(cliKey?: string): string | null`

Resolves API key from all available sources in priority order.

**Parameters**:
- `cliKey` (string, optional): API key provided via CLI parameter

**Returns**: 
- `string | null`: Resolved API key (trimmed, validated) or `null` if no key found

**Priority Order**:
1. CLI parameter (`cliKey`)
2. Environment variable (`ANTHROPIC_API_KEY`)
3. Project config file (`.testarion/config.json`)
4. Global config file (`~/.testarion/config.json`)

**Behavior**:
- Trims whitespace from all sources
- Validates format (must start with `sk-ant-`)
- Returns first non-empty key found
- Returns `null` if no key found in any source

**Throws**:
- `ConfigError`: If key format is invalid (after resolution)

---

### `readConfigFile(filePath: string): ConfigFile | null`

Reads and parses a configuration file.

**Parameters**:
- `filePath` (string): Absolute path to config file

**Returns**:
- `ConfigFile | null`: Parsed config object or `null` if file doesn't exist

**Behavior**:
- Returns `null` if file doesn't exist (not an error)
- Parses JSON with `JSON.parse()`
- Returns only `anthropicApiKey` field (ignores other fields)
- Trims whitespace from `anthropicApiKey` value

**Throws**:
- `ConfigError`: If file exists but contains invalid JSON

---

### `writeConfigFile(filePath: string, apiKey: string): void`

Writes API key to a configuration file.

**Parameters**:
- `filePath` (string): Absolute path to config file
- `apiKey` (string): API key to save

**Returns**: `void`

**Behavior**:
- Creates parent directory (`.testarion`) if it doesn't exist
- Reads existing config file if it exists (preserves other fields)
- Updates `anthropicApiKey` field
- Writes JSON to file
- Sets file permissions to `0o600`
- Sets directory permissions to `0o700`

**Throws**:
- `ConfigError`: If directory creation fails, file write fails, or permission setting fails

---

### `validateApiKeyFormat(key: string): boolean`

Validates API key format.

**Parameters**:
- `key` (string): API key to validate

**Returns**:
- `boolean`: `true` if format is valid, `false` otherwise

**Validation Rules**:
- Key must start with `sk-ant-` prefix
- Key is trimmed before validation
- Empty string (after trimming) returns `false`

---

### `getProjectConfigPath(): string`

Gets the absolute path to project-level config file.

**Returns**:
- `string`: Absolute path to `.testarion/config.json` in current working directory

---

### `getGlobalConfigPath(): string`

Gets the absolute path to global config file.

**Returns**:
- `string`: Absolute path to `~/.testarion/config.json` in user home directory

---

### `shouldPromptToSave(cliKey?: string, envKey?: string): boolean`

Determines if save prompt should be shown.

**Parameters**:
- `cliKey` (string, optional): API key from CLI parameter
- `envKey` (string, optional): API key from environment variable

**Returns**:
- `boolean`: `true` if prompt should be shown, `false` otherwise

**Behavior**:
- Returns `true` if:
  - Key provided via CLI or env var
  - No config file exists (project or global)
  - Prompt not shown this session yet
- Returns `false` otherwise

---

## Types

### `ConfigFile`

```typescript
interface ConfigFile {
  anthropicApiKey?: string;
  // Other fields may exist but are ignored
}
```

### `ConfigError`

```typescript
class ConfigError extends Error {
  constructor(
    message: string,
    public readonly filePath?: string,
    public readonly cause?: Error
  );
}
```

---

## Error Handling

All functions throw `ConfigError` for config-related errors:
- Invalid JSON syntax in config file
- File permission errors
- Directory creation failures
- Invalid API key format (after resolution)

Error messages are user-friendly and include file paths when relevant.

---

## Usage Examples

### Resolve API Key
```typescript
import { resolveApiKey } from './utils/config-loader';

const apiKey = resolveApiKey(options.anthropicApiKey);
if (!apiKey) {
  console.error('No API key configured');
  process.exit(1);
}
```

### Read Config File
```typescript
import { readConfigFile, getProjectConfigPath } from './utils/config-loader';

const configPath = getProjectConfigPath();
const config = readConfigFile(configPath);
if (config?.anthropicApiKey) {
  console.log('Found API key in config file');
}
```

### Write Config File
```typescript
import { writeConfigFile, getProjectConfigPath } from './utils/config-loader';

const configPath = getProjectConfigPath();
writeConfigFile(configPath, 'sk-ant-api03-...');
console.log('API key saved to config file');
```

### Check if Should Prompt
```typescript
import { shouldPromptToSave } from './utils/config-loader';

if (shouldPromptToSave(options.anthropicApiKey, process.env.ANTHROPIC_API_KEY)) {
  // Show prompt to user
}
```



