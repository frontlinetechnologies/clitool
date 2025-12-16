# Research: User API Key Configuration

**Feature**: Provide Own AI API Key  
**Date**: 2025-01-16  
**Phase**: 0 - Research & Technology Selection

## Technology Decisions

### Decision: Use Native Node.js fs Module for Config File Operations

**Rationale**: 
- No external dependencies required (Article VI: Dependency Minimalism)
- Native fs module provides all needed functionality (readFileSync, writeFileSync, mkdirSync)
- File permissions can be set using fs.chmodSync() (mode 0o600)
- Cross-platform path handling via path.join() and os.homedir()
- Simple, maintainable solution for JSON file I/O

**Alternatives Considered**:
- **configstore**: Adds dependency, overkill for simple JSON files
- **dotenv**: Designed for .env files, not general config files
- **conf**: Adds dependency, unnecessary abstraction
- **Custom file handling library**: Native fs is sufficient

**Implementation Notes**: 
- Use `fs.readFileSync()` for reading config files
- Use `fs.writeFileSync()` with `{ mode: 0o600 }` for creating files
- Use `fs.mkdirSync()` with `{ recursive: true }` for directory creation
- Use `path.join()` for cross-platform path construction
- Use `os.homedir()` for global config path resolution

---

### Decision: JSON Format for Configuration Files

**Rationale**:
- Human-readable and editable
- Native JSON.parse() support in Node.js (no dependencies)
- Extensible structure allows other fields beyond `anthropicApiKey`
- Standard format familiar to developers
- Spec already assumes JSON format

**Alternatives Considered**:
- **YAML**: Requires yaml parser dependency, adds complexity
- **TOML**: Less common, requires parser dependency
- **INI format**: Too simplistic, doesn't handle nested structures well
- **Custom format**: Unnecessary when JSON is standard

**Implementation Notes**:
- Parse with `JSON.parse()` with try/catch for syntax errors
- Structure: `{ "anthropicApiKey": "sk-ant-..." }`
- Ignore unknown fields (only read `anthropicApiKey`)
- Preserve existing fields when updating (read, modify, write)

---

### Decision: Config File Location Strategy

**Rationale**:
- Project-level config (`.testarion/config.json`) for project-specific keys
- Global config (`~/.testarion/config.json`) for default user key
- Priority order: CLI > env var > project config > global config
- Matches common CLI tool patterns (e.g., ESLint, Prettier)

**Alternatives Considered**:
- **Single global location only**: Less flexible, can't have project-specific keys
- **Single project location only**: Requires config in every project
- **XDG config directory**: Less standard on macOS/Windows, adds complexity

**Implementation Notes**:
- Project config: `path.join(process.cwd(), '.testarion', 'config.json')`
- Global config: `path.join(os.homedir(), '.testarion', 'config.json')`
- Check project config first, then global config
- Create `.testarion` directory if it doesn't exist when saving

---

### Decision: API Key Format Validation

**Rationale**:
- Anthropic API keys start with `sk-ant-` prefix
- Format validation prevents unnecessary API calls with invalid keys
- Provides immediate feedback to users
- Reduces API errors and improves UX

**Alternatives Considered**:
- **No format validation**: Would make API calls with invalid keys, wasting time
- **Full key validation via API call**: Slower, requires network request
- **Complex regex validation**: Overkill, prefix check is sufficient

**Implementation Notes**:
- Validate format: key must start with `sk-ant-`
- Trim whitespace before validation
- Validate before attempting API calls
- Display clear error message if format invalid

---

### Decision: File Permissions (600) for Security

**Rationale**:
- API keys are sensitive credentials
- 600 permissions (owner read/write only) prevent other users from reading keys
- Follows security best practices for credential storage
- Spec clarification explicitly requires this

**Alternatives Considered**:
- **Default permissions (644)**: Less secure, readable by group/others
- **700 (directory) + 600 (file)**: More secure but may cause issues on some systems
- **No explicit permissions**: Relies on umask, inconsistent across systems

**Implementation Notes**:
- Use `fs.chmodSync(filePath, 0o600)` after creating config file
- Also set directory permissions to 700 for `.testarion` directory
- Handle permission errors gracefully (may fail on some systems)

---

### Decision: Prompt-Based Auto-Creation

**Rationale**:
- Improves UX by offering to save keys users provide via CLI/env var
- Non-intrusive (once per session, can be declined)
- Aligns with Article II: Zero Configuration Start (optional, not required)
- Reduces friction for frequent users

**Alternatives Considered**:
- **Always auto-create silently**: Violates transparency principle, may surprise users
- **Never auto-create**: More manual work for users
- **Separate configure command**: Adds complexity, requires learning new command

**Implementation Notes**:
- Prompt once per command execution session
- Ask user to choose project-level or global location
- Only prompt if no config file exists and key provided via CLI/env var
- Track prompt state in session (don't prompt again if declined)

---

### Decision: Key Resolution Priority Order

**Rationale**:
- CLI parameter highest priority (explicit override)
- Environment variable second (session-level configuration)
- Project config third (project-specific defaults)
- Global config lowest (user default)
- Standard priority order matches user expectations

**Implementation Notes**:
- Check sources in order: CLI param → env var → project config → global config
- Return first non-empty key found
- Trim whitespace from all sources
- Validate format after resolution

---

### Decision: Error Message Strategy

**Rationale**:
- Clear, actionable error messages improve developer experience
- Differentiate between format errors, file errors, and API errors
- Provide guidance on how to fix issues
- Aligns with Article III: Transparent Operations

**Implementation Notes**:
- Format validation errors: "Invalid API key format. Anthropic keys start with 'sk-ant-'"
- File read errors: "Cannot read config file at [path]: [error]"
- File write errors: "Cannot write config file at [path]: [error]"
- Missing key (verbose mode): "No API key configured. Set ANTHROPIC_API_KEY, use --anthropic-api-key, or create config file"
- API authentication errors: "Invalid API key. Please verify your Anthropic API key is correct."

