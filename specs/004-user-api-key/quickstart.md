# Quick Start: User API Key Configuration

**Feature**: Provide Own AI API Key  
**Date**: 2025-01-16

## Overview

The CLI tool supports three methods for providing your Anthropic API key:
1. **Command-line parameter** (highest priority)
2. **Environment variable**
3. **Configuration file** (project-level or global)

## Quick Setup

### Method 1: Command-Line Parameter (One-Time Use)

```bash
generate-tests --anthropic-api-key sk-ant-api03-... < input.json
```

### Method 2: Environment Variable (Session-Level)

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
generate-tests < input.json
```

### Method 3: Configuration File (Persistent)

#### Project-Level Config (Recommended for Project-Specific Keys)

1. Create config file:
```bash
mkdir -p .testarion
echo '{"anthropicApiKey": "sk-ant-api03-..."}' > .testarion/config.json
chmod 600 .testarion/config.json
```

2. Use the tool:
```bash
generate-tests < input.json  # Key automatically loaded
```

#### Global Config (Recommended for Default Key)

1. Create config file:
```bash
mkdir -p ~/.testarion
echo '{"anthropicApiKey": "sk-ant-api03-..."}' > ~/.testarion/config.json
chmod 600 ~/.testarion/config.json
```

2. Use the tool:
```bash
generate-tests < input.json  # Key automatically loaded
```

## Auto-Save Prompt

When you provide an API key via CLI parameter or environment variable, the tool will prompt you to save it:

```
API key provided via command line. Save to config file? (y/n)
Choose location:
  1) Project-level (.testarion/config.json)
  2) Global (~/.testarion/config.json)
```

- Type `1` or `2` to save, or `n` to skip
- Prompt appears once per command execution session
- If you decline, the prompt won't appear again in that session

## Priority Order

The tool checks for API keys in this order (first found is used):

1. **CLI parameter** (`--anthropic-api-key`)
2. **Environment variable** (`ANTHROPIC_API_KEY`)
3. **Project config** (`.testarion/config.json`)
4. **Global config** (`~/.testarion/config.json`)

Example: If you set both an environment variable and a project config file, the environment variable takes precedence.

## Configuration File Format

The config file is a simple JSON file:

```json
{
  "anthropicApiKey": "sk-ant-api03-..."
}
```

**Notes**:
- The file can contain other fields (they'll be ignored)
- The API key value is trimmed automatically
- File permissions are set to 600 (owner read/write only) for security

## Validation

The tool validates API key format before use:
- Must start with `sk-ant-` prefix
- Whitespace is automatically trimmed
- Invalid format shows clear error message

## Error Messages

### Missing API Key
```
No API key configured. Set ANTHROPIC_API_KEY, use --anthropic-api-key, or create config file.
```

### Invalid Format
```
Invalid API key format. Anthropic keys start with 'sk-ant-'.
```

### Config File Error
```
Cannot read config file at /path/to/.testarion/config.json: [error details]
```

## Examples

### Using Project Config
```bash
# Create project config
mkdir -p .testarion
cat > .testarion/config.json << EOF
{
  "anthropicApiKey": "sk-ant-api03-..."
}
EOF
chmod 600 .testarion/config.json

# Use tool (key automatically loaded)
crawl https://example.com | generate-tests
```

### Overriding with CLI Parameter
```bash
# Even if config file exists, CLI parameter takes precedence
generate-tests --anthropic-api-key sk-ant-different-key < input.json
```

### Using Environment Variable
```bash
# Set for current session
export ANTHROPIC_API_KEY=sk-ant-api03-...

# Use tool
generate-tests < input.json

# Or set inline
ANTHROPIC_API_KEY=sk-ant-api03-... generate-tests < input.json
```

## Security Best Practices

1. **File Permissions**: Config files are automatically set to 600 (owner read/write only)
2. **Don't Commit**: Add `.testarion/` to `.gitignore` to avoid committing API keys
3. **Use Project Config**: For project-specific keys, use project-level config
4. **Use Global Config**: For personal default key, use global config
5. **Environment Variables**: Use for CI/CD pipelines or temporary sessions

## Troubleshooting

### Config file not found
- Check file path: `.testarion/config.json` (project) or `~/.testarion/config.json` (global)
- Ensure directory exists: `mkdir -p .testarion` or `mkdir -p ~/.testarion`

### Permission denied
- Check file permissions: `chmod 600 .testarion/config.json`
- Ensure you have read/write access to the directory

### Invalid JSON
- Validate JSON syntax: `cat .testarion/config.json | jq .`
- Ensure proper quotes and commas

### Key not working
- Verify key format starts with `sk-ant-`
- Check for whitespace (automatically trimmed, but verify)
- Ensure key is valid and not expired

