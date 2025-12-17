# @testarion/clitool

[![npm version](https://img.shields.io/npm/v/@testarion/clitool.svg)](https://www.npmjs.com/package/@testarion/clitool)
[![License: O'Saasy](https://img.shields.io/badge/License-O'Saasy-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@testarion/clitool.svg)](package.json)

AI-powered CLI tool for crawling web applications and generating E2E tests. Built for indie SaaS founders who need reliable testing without enterprise budgets.

**Features:**
- Crawl web apps to discover pages, forms, buttons, and input fields
- Generate Markdown documentation of site structure
- Generate Playwright E2E test scripts with AI-enhanced scenarios

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
  - [Crawl](#crawl)
  - [Generate Documentation](#generate-documentation)
  - [Generate Tests](#generate-tests)
- [API Key Configuration](#api-key-configuration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

```bash
# No installation required
npx @testarion/clitool crawl https://example.com
```

## Installation

```bash
npm install -g @testarion/clitool
```

Or install locally:

```bash
npm install
npm run build
```

## Usage

### Crawl

```bash
crawl https://example.com
```

**Options:**

- `--quiet`: Suppress progress updates
- `--format <json|text>`: Output format (default: json)
- `--verbose`: Include detailed information
- `--rate-limit <seconds>`: Delay between requests in seconds (default: 1.5)
- `--output <file>`: Save results to file

**Examples:**

```bash
# Basic crawl with JSON output
crawl https://example.com

# Quiet mode with file output
crawl https://example.com --quiet --output results.json

# Human-readable text output
crawl https://example.com --format text

# Verbose mode with custom rate limit
crawl https://example.com --verbose --rate-limit 2.5
```

### Generate Documentation

```bash
# Using npm script (recommended for development)
npm run crawl https://example.com | npm run generate-docs
npm run crawl https://example.com | npm run generate-docs -- --output docs.md

# Using node directly
node dist/cli/crawl.js https://example.com | node dist/cli/generate-docs.js
node dist/cli/crawl.js https://example.com | node dist/cli/generate-docs.js --output docs.md

# After npm link (makes commands available globally)
crawl https://example.com | generate-docs
crawl https://example.com | generate-docs --output docs.md

# Generate from existing crawl results file
cat crawl-results.json | npm run generate-docs
cat crawl-results.json | node dist/cli/generate-docs.js

# With AI descriptions (using environment variable)
export ANTHROPIC_API_KEY=your-api-key
npm run crawl https://example.com | npm run generate-docs -- --output docs.md

# With AI descriptions (using command-line parameter)
npm run crawl https://example.com | npm run generate-docs -- --anthropic-api-key your-api-key --output docs.md
```

**Options:**

- `--output <file>`: Save documentation to file instead of stdout
- `--anthropic-api-key <key>`: Anthropic API key for AI-generated page descriptions
- `--verbose`: Show detailed information including API key configuration guidance

The `generate-docs` command reads crawl results JSON from stdin and generates comprehensive Markdown documentation including:
- Site structure and navigation paths
- Critical user flows (login, checkout, form submissions)
- Page details with forms, buttons, and input fields
- AI-generated page descriptions (when API key is available)

### Generate Tests

```bash
# Using npm script (recommended for development)
npm run crawl https://example.com | npm run generate-tests
npm run crawl https://example.com | npm run generate-tests -- --output-dir ./e2e-tests

# Using node directly
node dist/cli/crawl.js https://example.com | node dist/cli/generate-tests.js
node dist/cli/crawl.js https://example.com | node dist/cli/generate-tests.js --output-dir ./e2e-tests

# After npm link (makes commands available globally)
crawl https://example.com | generate-tests
crawl https://example.com | generate-tests --output-dir ./e2e-tests

# Generate from existing crawl results file
cat crawl-results.json | npm run generate-tests
cat crawl-results.json | node dist/cli/generate-tests.js

# With AI enhancement (using environment variable)
export ANTHROPIC_API_KEY=your-api-key
npm run crawl https://example.com | npm run generate-tests

# With AI enhancement (using command-line parameter)
npm run crawl https://example.com | npm run generate-tests -- --anthropic-api-key your-api-key
```

**Options:**

- `--output-dir <directory>`: Output directory for test files (default: `./tests/generated/`)
- `--anthropic-api-key <key>`: Anthropic API key for AI-enhanced test scenarios
- `--verbose`: Show detailed information including API key configuration guidance

The `generate-tests` command reads crawl results JSON from stdin and generates Playwright end-to-end test scripts including:
- Test files organized by user flow (one file per flow)
- Navigation tests for discovered pages
- Form submission tests with realistic test data
- Login flow tests (when email/password fields detected)
- Checkout flow tests (when payment fields detected)
- Specific scenario tests (e.g., coupon codes when detected)
- AI-enhanced test scenarios and assertions (when API key is available)

**Example Generated Test File:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('https://example.com/login');
    await expect(page).toHaveTitle(/Login/);
  });

  test('should fill login form and submit', async ({ page }) => {
    await page.goto('https://example.com/login');
    await page.getByLabel('Email').fill('test.user@example.com');
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

**Running Generated Tests:**

```bash
# Install Playwright browsers (required)
npx playwright install

# Run all generated tests
npx playwright test tests/generated/

# Run specific test file
npx playwright test tests/generated/login-flow.spec.ts
```

## API Key Configuration

The AI-enhanced features require an Anthropic API key. The tool supports three methods for providing your API key, checked in this priority order:

### Method 1: Command-Line Parameter (Highest Priority)

```bash
generate-tests --anthropic-api-key sk-ant-api03-... < input.json
```

### Method 2: Environment Variable

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
generate-tests < input.json
```

### Method 3: Configuration File (Persistent)

**Project-level config** (recommended for project-specific keys):

```bash
mkdir -p .testarion
echo '{"anthropicApiKey": "sk-ant-api03-..."}' > .testarion/config.json
chmod 600 .testarion/config.json
```

**Global config** (recommended for default key):

```bash
mkdir -p ~/.testarion
echo '{"anthropicApiKey": "sk-ant-api03-..."}' > ~/.testarion/config.json
chmod 600 ~/.testarion/config.json
```

Once configured, the tool automatically uses your key:

```bash
generate-tests < input.json  # Key automatically loaded from config file
```

### Auto-Save Prompt

When you provide an API key via CLI or environment variable, the tool offers to save it to a config file (once per session). This prompt only appears when stdin is a TTY and no config file exists.

### Security Notes

- Config files are automatically set to 600 permissions (owner read/write only)
- Add `.testarion/` to your `.gitignore` to avoid committing API keys
- API keys must start with `sk-ant-` prefix (format is validated)

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
npm run test:coverage
```

### Lint

```bash
npm run lint
npm run lint:fix
```

## Troubleshooting

### Playwright browser not installed

If you see an error about missing browsers when running generated tests:

```bash
npx playwright install
```

### API key validation errors

Ensure your API key:
- Starts with `sk-ant-` prefix
- Is not expired
- Has sufficient credits

### Rate limiting errors

If crawling fails due to rate limits, increase the delay:

```bash
crawl https://example.com --rate-limit 3.0
```

### Empty crawl results

- Check that the URL is accessible
- Verify the site doesn't block automated requests
- Try running with `--verbose` for more details

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [O'Saasy License](LICENSE) - MIT with SaaS rights reserved.

## Requirements

- Node.js >= 18.0.0
- TypeScript 5.x
