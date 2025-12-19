# Data Model: User API Key Configuration

**Feature**: Provide Own AI API Key  
**Date**: 2025-01-16  
**Phase**: 1 - Design & Contracts

## Entities

### Configuration File

**Type**: JSON file  
**Locations**:
- Project-level: `.testarion/config.json` (relative to project root)
- Global: `~/.testarion/config.json` (user home directory)

**Structure**:
```typescript
interface ConfigFile {
  anthropicApiKey?: string;  // Optional, may be missing
  // Other fields may exist but are ignored by this feature
}
```

**Fields**:
- `anthropicApiKey` (string, optional): User's Anthropic API key. Must start with `sk-ant-` prefix. Whitespace is trimmed automatically.

**Validation Rules**:
- File must be valid JSON (parseable with `JSON.parse()`)
- `anthropicApiKey` field, if present, must be a string
- `anthropicApiKey` format validation: must start with `sk-ant-` prefix
- Whitespace is trimmed from `anthropicApiKey` value

**File Permissions**:
- File: `0o600` (owner read/write only)
- Directory (`.testarion`): `0o700` (owner read/write/execute only)

**Lifecycle**:
1. **Creation**: File created when user confirms save prompt, or manually created by user
2. **Read**: File read during key resolution (if exists)
3. **Update**: File updated when user saves new key (preserves other fields)
4. **Deletion**: User can manually delete file (not handled by tool)

**State Transitions**:
- Non-existent → Exists: Created via save prompt or manual creation
- Exists → Updated: Key value changed via save prompt
- Exists → Non-existent: User manually deletes file

---

### API Key Resolution

**Type**: Process/Algorithm (not a data entity)

**Input Sources** (checked in priority order):
1. CLI parameter: `--anthropic-api-key <key>`
2. Environment variable: `ANTHROPIC_API_KEY`
3. Project config file: `.testarion/config.json` → `anthropicApiKey` field
4. Global config file: `~/.testarion/config.json` → `anthropicApiKey` field

**Output**: 
- Resolved API key string (trimmed, validated) OR `null` if no key found

**Resolution Algorithm**:
```
1. If CLI parameter provided → return trimmed value (validate format)
2. If env var set → return trimmed value (validate format)
3. If project config exists and has anthropicApiKey → return trimmed value (validate format)
4. If global config exists and has anthropicApiKey → return trimmed value (validate format)
5. Return null (no key found)
```

**Validation**:
- Format: Must start with `sk-ant-` prefix
- Whitespace: Trimmed before validation
- Empty strings treated as missing (after trimming)

---

### Config Loader State

**Type**: Module-level state (for prompt tracking)

**State Variables**:
- `promptShownThisSession`: boolean (tracks if save prompt already shown)

**State Transitions**:
- `false` → `true`: Prompt shown to user
- Persists for duration of command execution session
- Resets on new command invocation

---

## Relationships

- **Config File ↔ API Key**: One-to-one (one config file contains one API key)
- **Project Config ↔ Global Config**: Independent (both can exist, project takes precedence)
- **CLI Parameter → API Key**: Overrides all other sources
- **Environment Variable → API Key**: Overrides config files only

---

## Data Flow

### Key Resolution Flow
```
User Input (CLI/Env/Config)
    ↓
[Trim Whitespace]
    ↓
[Format Validation: starts with "sk-ant-"?]
    ↓
[Yes] → Use Key
[No]  → Display Error, Exit
```

### Config File Read Flow
```
Check Project Config Exists?
    ↓ [Yes]
Read & Parse JSON
    ↓
Extract anthropicApiKey Field
    ↓
[Exists?] → Return Value
[No]     → Check Global Config
```

### Config File Write Flow
```
User Confirms Save Prompt
    ↓
Choose Location (Project/Global)
    ↓
Create .testarion Directory (if needed)
    ↓
Read Existing Config (if exists)
    ↓
Update anthropicApiKey Field
    ↓
Write JSON to File
    ↓
Set Permissions (0o600)
```

---

## Constraints

1. **File System**: User must have read/write permissions in target directory
2. **JSON Format**: Config file must be valid JSON (syntax errors handled gracefully)
3. **Key Format**: API keys must match Anthropic format (`sk-ant-*`)
4. **Permissions**: File permissions set to 600, directory to 700 (may fail on some systems)
5. **Cross-Platform**: Path handling must work on macOS, Linux, Windows

---

## Error Conditions

1. **Config File Syntax Error**: Invalid JSON → Display parse error with file location
2. **File Read Permission Error**: Cannot read config file → Skip that source, continue resolution
3. **File Write Permission Error**: Cannot write config file → Display error, don't save
4. **Invalid Key Format**: Key doesn't start with `sk-ant-` → Display format error, exit
5. **Directory Creation Failure**: Cannot create `.testarion` directory → Display error, don't save
6. **Home Directory Resolution Failure**: Cannot resolve `~` → Use absolute path or display error




