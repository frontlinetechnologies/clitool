# Quickstart: AI Context Option

**Feature**: 007-ai-context-option
**Date**: 2025-12-19

## Overview

This feature adds optional context to AI-powered commands. Users can provide additional guidance about their application to improve test generation and documentation quality.

## Usage Examples

### Provide context via file

```bash
# Create a context file
echo "Focus on checkout flow. Test with logged-in users. Avoid admin pages." > context.md

# Use with crawl command
testarion crawl https://example.com --context context.md

# Use with test generation
cat crawl-results.json | testarion generate-tests --context context.md
```

### Provide context inline

```bash
# Quick inline context
testarion crawl https://example.com --context-text "Focus on mobile viewport sizes"

# Combine with file context
testarion crawl https://example.com \
  --context context.md \
  --context-text "Also test dark mode toggle"
```

### Set default context via environment variable

```bash
# Set for current session
export TESTARION_CONTEXT="Always test with authenticated user state"

# Run commands without --context flag
testarion crawl https://example.com
testarion generate-tests < results.json

# CLI options override/add to environment context
testarion crawl https://example.com --context-text "Extra instructions"
```

## Context File Format

Context files can be plain text or markdown. Example:

```markdown
# Testing Context for MyApp

## Important User Flows
1. User registration and email verification
2. Checkout with credit card
3. Password reset flow

## Areas to Focus On
- Shopping cart edge cases (empty cart, max items)
- Form validation on checkout page
- Mobile responsive behavior

## Things to Avoid
- Admin panel (/admin/*)
- Internal API endpoints
- Development-only routes
```

## Size Limits

| Threshold | Behavior |
|-----------|----------|
| < 50KB | Normal processing |
| 50KB - 100KB | Warning displayed, processing continues |
| > 100KB | Error, processing stops |

## Troubleshooting

**Error: Context file not found**
```
Error: Context file not found: ./missing.md
Run with an existing .md or .txt file.
```
→ Check the file path is correct and the file exists.

**Error: Invalid UTF-8 encoding**
```
Error: Context file contains invalid characters: ./context.md
Ensure the file is saved as UTF-8.
```
→ Re-save the file with UTF-8 encoding in your text editor.

**Warning: Large context file**
```
Warning: Context file is large (75KB). This may affect AI response time.
```
→ Consider summarizing the content. The file will still be processed.

## How Context is Used

When you provide context, it's included in the AI prompt with a header:

```
### Additional Context:
### From File:
[Your file content here]

### Inline:
[Your inline text here]

### From Environment:
[Your environment variable content here]
```

The AI uses this information to:
- Generate more relevant test scenarios
- Focus on specified user flows
- Avoid testing excluded areas
- Understand application-specific terminology
