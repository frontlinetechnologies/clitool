# Feature Specification: Provide Own AI API Key

**Feature Branch**: `004-user-api-key`
**Created**: 2025-12-16
**Status**: Draft
**Input**: User description: "Provide Own AI API Key - Allow users to configure their own AI API key for test generation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure API Key via Environment Variable (Priority: P1)

As a developer, I want to set my Anthropic API key via environment variable so that I can securely configure the tool without exposing my key in command history.

**Why this priority**: Most common and secure method for providing API credentials. Already implemented.

**Independent Test**: Set `ANTHROPIC_API_KEY` environment variable and run any AI-enhanced command to verify it uses the key.

**Acceptance Scenarios**:

1. **Given** the `ANTHROPIC_API_KEY` environment variable is set, **When** I run `generate-tests` or `generate-docs`, **Then** the tool uses the API key for AI-enhanced features.
2. **Given** the `ANTHROPIC_API_KEY` environment variable is not set and no other key source is provided, **When** I run `generate-tests` or `generate-docs`, **Then** the tool operates without AI features and does not make API calls.

**Implementation Status**: ✅ Complete

---

### User Story 2 - Configure API Key via Command-Line Parameter (Priority: P1)

As a developer, I want to pass my API key as a command-line parameter so that I can override environment settings or use different keys for different projects.

**Why this priority**: Provides flexibility for one-off operations or project-specific configurations. Already implemented.

**Independent Test**: Run `generate-tests --anthropic-api-key <key>` and verify AI features work.

**Acceptance Scenarios**:

1. **Given** I have an API key, **When** I run `generate-tests --anthropic-api-key my-key`, **Then** the tool uses the provided key for AI features.
2. **Given** both environment variable and command-line parameter are set, **When** I run a command with `--anthropic-api-key`, **Then** the command-line parameter takes precedence.

**Implementation Status**: ✅ Complete

---

### User Story 3 - Configure API Key via Configuration File (Priority: P2)

As a developer working on multiple projects, I want to store my API key in a configuration file so that I don't have to provide it on every command invocation.

**Why this priority**: Improves developer experience for frequent users while maintaining security through file permissions.

**Independent Test**: Create a config file with API key, run a command without other key sources, verify AI features work.

**Acceptance Scenarios**:

1. **Given** a configuration file exists at `.testarion/config.json` with an `anthropicApiKey` field, **When** I run `generate-tests` without other key sources, **Then** the tool uses the key from the configuration file.
2. **Given** a configuration file exists at `~/.testarion/config.json` (global), **When** no project-level config exists, **Then** the tool uses the global configuration.
3. **Given** both project-level and global configuration files exist, **When** I run a command, **Then** project-level configuration takes precedence.
4. **Given** I provide an API key via CLI parameter or env var and no config file exists, **When** I run a command, **Then** the tool prompts once per session to save the key, asks me to choose project-level or global location, and auto-creates the chosen directory and `config.json` file if I confirm.
5. **Given** I decline the save-to-config prompt, **When** I run additional commands in the same session, **Then** the tool does not prompt again to save the key.

**Implementation Status**: ❌ Not Implemented

---

### User Story 4 - API Key Validation (Priority: P2)

As a developer, I want the tool to validate my API key before making requests so that I get immediate feedback on configuration errors instead of cryptic API failures.

**Why this priority**: Prevents wasted time debugging API errors caused by misconfigured keys.

**Independent Test**: Provide an invalid API key and verify the tool provides a clear error message without making actual API calls.

**Acceptance Scenarios**:

1. **Given** an API key that doesn't match the expected format, **When** I run any AI-enhanced command, **Then** the tool displays a clear error message explaining the key format is invalid.
2. **Given** an API key that has the correct format but is expired or invalid, **When** the first API call fails with an authentication error, **Then** the tool displays a specific message indicating the API key is not valid.
3. **Given** a valid API key, **When** I run any AI-enhanced command, **Then** the tool proceeds with AI features without any validation warnings.

**Implementation Status**: ⚠️ Partial (graceful failure exists, explicit validation needed)

---

### User Story 5 - Clear Error Messages (Priority: P2)

As a developer, I want clear error messages when my API key is missing or invalid so that I can quickly identify and fix configuration issues.

**Why this priority**: Improves developer experience by reducing debugging time for common issues.

**Independent Test**: Trigger various error conditions and verify messages are user-friendly and actionable.

**Acceptance Scenarios**:

1. **Given** no API key is configured anywhere, **When** I run `generate-tests --verbose`, **Then** the tool displays a message explaining how to configure an API key (env var, CLI param, or config file).
2. **Given** an invalid API key is provided, **When** the API returns an authentication error, **Then** the tool displays a message like "Invalid API key. Please verify your Anthropic API key is correct."
3. **Given** a rate limit or quota error, **When** the API returns such an error, **Then** the tool displays a message explaining the issue and suggesting to wait or check usage limits.

**Implementation Status**: ⚠️ Partial (basic errors handled, specific messages needed)

---

### Edge Cases

- What happens when configuration file has syntax errors? → Display parse error with file location
- What happens when API key contains whitespace? → Trim whitespace automatically
- What happens when multiple configuration sources conflict? → Use priority: CLI > env var > project config > global config
- How does system handle network errors vs authentication errors? → Differentiate in error messages

## Requirements *(mandatory)*

### Functional Requirements

**Existing (Already Implemented):**
- **FR-001**: System MUST support API key configuration via `ANTHROPIC_API_KEY` environment variable ✅
- **FR-002**: System MUST support API key configuration via `--anthropic-api-key` command-line parameter ✅
- **FR-003**: Command-line parameter MUST take precedence over environment variable ✅
- **FR-004**: System MUST NOT make API calls when no API key is configured ✅
- **FR-005**: System MUST gracefully fall back to non-AI features when API key is unavailable ✅

**New (To Be Implemented):**
- **FR-006**: System MUST support API key configuration via project-level configuration file at `.testarion/config.json`
- **FR-007**: System MUST support API key configuration via global configuration file at `~/.testarion/config.json`
- **FR-008**: Configuration priority MUST be: CLI parameter > environment variable > project config > global config
- **FR-014**: System MUST auto-create config file (and `.testarion` directory if needed) when user provides API key via CLI or env var, prompting once per session to save it and asking user to choose project-level or global location
- **FR-009**: System MUST validate API key format before attempting API calls (Anthropic keys start with `sk-ant-`)
- **FR-010**: System MUST display specific error messages for authentication failures
- **FR-011**: System MUST display specific error messages for rate limit/quota errors
- **FR-012**: System MUST provide guidance on API key configuration when key is missing and `--verbose` flag is used
- **FR-013**: System MUST trim whitespace from API keys loaded from any source
- **FR-015**: System MUST ignore unknown fields in configuration files (only reads `anthropicApiKey` field)
- **FR-016**: System MUST set file permissions to 600 (owner read/write only) when creating config files

### Key Entities

- **Configuration File**: JSON file containing user preferences including `anthropicApiKey`. Located at `.testarion/config.json` (project) or `~/.testarion/config.json` (global). May contain other fields beyond `anthropicApiKey`; tool ignores unknown fields. File permissions set to 600 (owner read/write only) for security.
- **API Key**: User's Anthropic API credential. Format: starts with `sk-ant-`, variable length string.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure API key through any of the three supported methods (env var, CLI, config file) and use AI features within 30 seconds
- **SC-002**: Users receive clear, actionable error messages for configuration issues on first attempt
- **SC-003**: Zero API calls are made without user-provided credentials
- **SC-004**: Configuration priority (CLI > env > project config > global config) works correctly in all tested scenarios
- **SC-005**: Invalid API key format is detected and reported before any network requests are made

## Clarifications

### Session 2025-01-16

- Q: Should the tool auto-create config files when users provide API keys via CLI/env var, or require manual creation? → A: Auto-create config file (and `.testarion` directory if needed) when user provides API key via CLI or env var, prompting to save it
- Q: Can config files contain other fields beyond `anthropicApiKey`, or should they be restricted? → A: Config file can contain other fields beyond `anthropicApiKey`; tool ignores unknown fields
- Q: How often should the save-to-config prompt appear when API key is provided via CLI/env var? → A: Prompt once per command execution session; if user declines, don't prompt again in that session
- Q: When prompting to save API key, should the tool ask user to choose project-level or global config location? → A: Prompt asks user to choose: project-level (`.testarion/config.json`) or global (`~/.testarion/config.json`)
- Q: What file permissions should be set when creating config files? → A: Set file permissions to 600 (owner read/write only) when creating config files

## Assumptions

1. Anthropic API keys follow the `sk-ant-*` format prefix pattern
2. Users have file system access to create configuration files in project directory or home directory
3. JSON is an acceptable format for configuration files
4. The tool already handles network errors gracefully (this feature focuses on authentication/configuration errors)
