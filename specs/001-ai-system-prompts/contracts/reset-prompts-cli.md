# Contract: reset-prompts CLI Command

**Feature**: 001-ai-system-prompts
**Date**: 2025-12-17

## Command Overview

```
reset-prompts [prompt-name] [options]
```

Resets AI system prompts to their default values by copying from `prompts/defaults/` to `prompts/`.

## Usage

```bash
# Reset all prompts to defaults
npx @testarion/clitool reset-prompts

# Reset a specific prompt
npx @testarion/clitool reset-prompts page-analysis

# List available prompts without resetting
npx @testarion/clitool reset-prompts --list

# Force reset without confirmation
npx @testarion/clitool reset-prompts --force

# Combine: reset specific prompt without confirmation
npx @testarion/clitool reset-prompts page-analysis --force
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `prompt-name` | No | Specific prompt to reset (e.g., `page-analysis`). If omitted, resets all prompts. |

## Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--list` | `-l` | false | List available prompts and their status (user/default) |
| `--force` | `-f` | false | Skip confirmation prompt for overwriting existing files |
| `--verbose` | `-v` | false | Show detailed output including file paths |
| `--help` | `-h` | - | Display help information |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - prompt(s) reset successfully |
| 1 | Error - invalid prompt name, file system error, or user cancelled |

## Output Format

### List Mode (`--list`)

```
Available prompts:

  page-analysis
    Status: user-modified
    User:    ./prompts/page-analysis.md
    Default: ./prompts/defaults/page-analysis.md

  test-scenario-generation
    Status: using-default
    Default: ./prompts/defaults/test-scenario-generation.md

  test-data-generation
    Status: user-modified
    User:    ./prompts/test-data-generation.md
    Default: ./prompts/defaults/test-data-generation.md

Total: 3 prompts (2 user-modified, 1 using-default)
```

### Reset Mode (default)

```
The following prompts will be reset to defaults:
  - page-analysis (overwrite existing)
  - test-data-generation (overwrite existing)

This will overwrite your customizations. Continue? (y/N) y

✓ Reset page-analysis
✓ Reset test-data-generation

Successfully reset 2 prompt(s) to defaults.
```

### Reset Specific Prompt

```
Reset 'page-analysis' to default? This will overwrite your customizations. (y/N) y

✓ Reset page-analysis

Prompt 'page-analysis' has been reset to default.
```

### Verbose Mode

```
[INFO] Prompts directory: /Users/dev/project/prompts
[INFO] Defaults directory: /Users/dev/project/prompts/defaults
[DEBUG] Checking user prompt: /Users/dev/project/prompts/page-analysis.md (exists)
[DEBUG] Checking default prompt: /Users/dev/project/prompts/defaults/page-analysis.md (exists)
[INFO] Copying /Users/dev/project/prompts/defaults/page-analysis.md -> /Users/dev/project/prompts/page-analysis.md
✓ Reset page-analysis

Successfully reset 1 prompt(s) to defaults.
```

## Error Messages

### Invalid Prompt Name

```
Error: Unknown prompt 'invalid-name'

Available prompts:
  - page-analysis
  - test-scenario-generation
  - test-data-generation

Run 'reset-prompts --list' to see all available prompts.
```

### Missing Default Prompt

```
Error: Default prompt not found for 'page-analysis'

Expected location: ./prompts/defaults/page-analysis.md

This may indicate a corrupted installation. Try reinstalling the package.
```

### Permission Error

```
Error: Cannot write to ./prompts/page-analysis.md

Reason: Permission denied
Fix: Check file permissions or run with appropriate privileges.
```

### User Cancelled

```
Reset cancelled. No changes made.
```

## Behavior Matrix

| Scenario | User Prompt | Default Prompt | `--force` | Behavior |
|----------|-------------|----------------|-----------|----------|
| Reset modified | ✅ Exists | ✅ Exists | No | Prompt for confirmation, then copy |
| Reset modified | ✅ Exists | ✅ Exists | Yes | Copy without confirmation |
| Reset missing | ❌ Missing | ✅ Exists | No | Copy (no confirmation needed) |
| Reset missing | ❌ Missing | ✅ Exists | Yes | Copy |
| No default | ✅ or ❌ | ❌ Missing | - | Error: default not found |

## Integration with package.json

Add to `bin` in package.json:

```json
{
  "bin": {
    "crawl": "./dist/cli/crawl.js",
    "generate-docs": "./dist/cli/generate-docs.js",
    "generate-tests": "./dist/cli/generate-tests.js",
    "reset-prompts": "./dist/cli/reset-prompts.js"
  }
}
```

## Implementation Notes

1. Use `commander` for CLI parsing (consistent with existing commands)
2. Use `readline` for interactive confirmation (consistent with API key prompt)
3. Skip confirmation if stdin is not a TTY (piped input)
4. Log to stderr for status messages, keep stdout clean
5. Use existing logger with verbose flag support
