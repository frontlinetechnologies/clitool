# @testarion/cli

[![npm version](https://img.shields.io/npm/v/@testarion/cli.svg)](https://www.npmjs.com/package/@testarion/cli)
[![License: O'Saasy](https://img.shields.io/badge/License-O'Saasy-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@testarion/cli.svg)](package.json)

AI-powered CLI tool for crawling web applications and generating E2E tests. Built for indie SaaS founders who need reliable testing without enterprise budgets.

**Features:**
- Crawl web apps to discover pages, forms, buttons, and input fields
- Generate Markdown documentation of site structure
- Generate Playwright E2E test scripts with AI-enhanced scenarios

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Crawl](#crawl)
  - [Authenticated Crawling](#authenticated-crawling)
  - [Generate Documentation](#generate-documentation)
  - [Generate Tests](#generate-tests)
  - [Reset Prompts](#reset-prompts)
- [API Key Configuration](#api-key-configuration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

```bash
# No installation required
npx @testarion/cli crawl https://example.com
```

## Installation

```bash
npm install -g @testarion/cli
```

Or install locally:

```bash
npm install
npm run build
```

## Requirements

- Node.js >= 18.0.0
- TypeScript 5.x

## Usage

### Crawl

```bash
testarion crawl https://example.com
```

**Options:**

- `--quiet`: Suppress progress updates
- `--format <json|text>`: Output format (default: json)
- `--verbose`: Include detailed information
- `--rate-limit <seconds>`: Delay between requests in seconds (default: 1.5)
- `--output <file>`: Save results to file
- `--max-pages <n>`: Maximum number of pages to crawl
- `--max-depth <n>`: Maximum link depth from start URL
- `--include <pattern...>`: Only crawl URLs matching pattern (glob or /regex/)
- `--exclude <pattern...>`: Skip URLs matching pattern (glob or /regex/)

**Examples:**

```bash
# Basic crawl with JSON output
testarion crawl https://example.com

# Quiet mode with file output
testarion crawl https://example.com --quiet --output results.json

# Human-readable text output
testarion crawl https://example.com --format text

# Verbose mode with custom rate limit
testarion crawl https://example.com --verbose --rate-limit 2.5

# Crawl only product pages, exclude admin
testarion crawl https://example.com --include "**/products/**" --exclude "**/admin/**"

# Limit crawl scope
testarion crawl https://example.com --max-pages 50 --max-depth 3
```

### Authenticated Crawling

Crawl pages that require authentication using email/password login or pre-existing session state.

**Authentication Options:**

- `--auth-role <name>`: Role name for credentials (requires env vars: `{ROLE}_EMAIL`, `{ROLE}_PASSWORD`)
- `--login-url <url>`: Login page URL for form-based authentication
- `--username-selector <selector>`: CSS selector for username/email field (optional, auto-detected)
- `--password-selector <selector>`: CSS selector for password field (optional, auto-detected)
- `--submit-selector <selector>`: CSS selector for submit button (optional, auto-detected)
- `--auth-success-url <pattern>`: URL pattern indicating successful login
- `--auth-success-selector <selector>`: CSS selector indicating successful login
- `--auth-success-cookie <name>`: Cookie name indicating successful login
- `--storage-state <path>`: Use pre-existing Playwright storage state file
- `--auth-config <path>`: Path to authentication config file (JSON)
- `--skip-unauthenticated`: Skip unauthenticated baseline crawl (only crawl as authenticated role)

**Examples:**

```bash
# Crawl with email/password authentication
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD=secretpassword
testarion crawl https://example.com --auth-role admin --login-url https://example.com/login

# Crawl with custom selectors
testarion crawl https://example.com \
  --auth-role admin \
  --login-url https://example.com/login \
  --username-selector "#email" \
  --password-selector "#password" \
  --submit-selector "button[type=submit]"

# Crawl using pre-existing session state
testarion crawl https://example.com --storage-state ./auth-state.json

# Crawl with auth config file
testarion crawl https://example.com --auth-config ./testarion.auth.json
```

**Authentication Config File Format:**

Create a `testarion.auth.json` file:

```json
{
  "roles": [
    {
      "name": "admin",
      "credentials": {
        "identifierEnvVar": "ADMIN_EMAIL",
        "passwordEnvVar": "ADMIN_PASSWORD"
      },
      "authMethod": { "type": "form-login" }
    }
  ],
  "login": {
    "url": "https://example.com/login",
    "selectors": {
      "identifier": "#email",
      "password": "#password",
      "submit": "button[type=submit]"
    },
    "successIndicators": [
      { "type": "url-pattern", "pattern": "/dashboard" }
    ]
  }
}
```

**Security Notes:**

- Credentials are always loaded from environment variables, never hardcoded
- Add `testarion.auth.json` and `*.auth-state.json` to `.gitignore`
- Storage state files contain session cookies - treat as sensitive

### Generate Documentation

```bash
# Basic usage
testarion crawl https://example.com | testarion generate-docs
testarion crawl https://example.com | testarion generate-docs --output docs.md

# Generate from existing crawl results file
cat crawl-results.json | testarion generate-docs

# With AI descriptions (using environment variable)
export ANTHROPIC_API_KEY=your-api-key
testarion crawl https://example.com | testarion generate-docs --output docs.md

# With AI descriptions (using command-line parameter)
testarion crawl https://example.com | testarion generate-docs --anthropic-api-key your-api-key --output docs.md
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
# Basic usage
testarion crawl https://example.com | testarion generate-tests
testarion crawl https://example.com | testarion generate-tests --output-dir ./e2e-tests

# Generate from existing crawl results file
cat crawl-results.json | testarion generate-tests

# With AI enhancement (using environment variable)
export ANTHROPIC_API_KEY=your-api-key
testarion crawl https://example.com | testarion generate-tests

# With AI enhancement (using command-line parameter)
testarion crawl https://example.com | testarion generate-tests --anthropic-api-key your-api-key

# Generate with authentication fixtures
testarion crawl https://example.com | testarion generate-tests --auth-fixtures --auth-config ./testarion.auth.json
```

**Options:**

- `--output-dir <directory>`: Output directory for test files (default: `./tests/generated/`)
- `--anthropic-api-key <key>`: Anthropic API key for AI-enhanced test scenarios
- `--verbose`: Show detailed information including API key configuration guidance
- `--auth-fixtures`: Generate authentication fixtures file for role-based tests
- `--auth-config <path>`: Path to authentication config file (for auth fixtures generation)

The `generate-tests` command reads crawl results JSON from stdin and generates Playwright end-to-end test scripts including:
- Test files organized by user flow (one file per flow)
- Navigation tests for discovered pages
- Form submission tests with realistic test data
- Login flow tests (when email/password fields detected)
- Checkout flow tests (when payment fields detected)
- Specific scenario tests (e.g., coupon codes when detected)
- AI-enhanced test scenarios and assertions (when API key is available)
- Authentication fixtures for role-based testing (with `--auth-fixtures`)

**Auth Fixtures:**

When using `--auth-fixtures`, the generator creates:
- `auth.fixtures.ts`: Playwright fixtures with authenticated browser contexts per role
- `.env.example`: Template for required environment variables

The generated fixtures use environment variables for credentials - never hardcoded values:

```typescript
// auth.fixtures.ts (generated)
import { test as base, BrowserContext } from '@playwright/test';

export const test = base.extend<{ adminContext: BrowserContext }>({
  adminContext: async ({ browser }, use) => {
    const identifier = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!identifier || !password) {
      throw new Error('Missing credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD.');
    }

    const context = await browser.newContext();
    // ... performs login ...
    await use(context);
    await context.close();
  },
});
```

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

### Reset Prompts

Manage AI system prompts used for page analysis and test generation.

```bash
# List all prompts and their status
testarion reset-prompts --list

# Reset all prompts to defaults
testarion reset-prompts --force

# Reset a specific prompt
testarion reset-prompts page-analysis
```

**Options:**

- `[prompt-name]`: Specific prompt to reset (optional)
- `--list, -l`: List available prompts and their customization status
- `--force, -f`: Skip confirmation prompts
- `--verbose, -v`: Show detailed output including file paths

**Available Prompts:**

| Prompt | Purpose |
|--------|---------|
| `page-analysis` | AI page description generation |
| `test-scenario-generation` | Test scenario creation |
| `test-data-generation` | Test data synthesis |

Prompts can be customized by editing files in your project's `.testarion/prompts/` directory. Use `reset-prompts` to restore defaults.

## API Key Configuration

The AI-enhanced features require an Anthropic API key. The tool supports three methods for providing your API key, checked in this priority order:

### Method 1: Command-Line Parameter (Highest Priority)

```bash
testarion generate-tests --anthropic-api-key sk-ant-api03-... < input.json
```

### Method 2: Environment Variable

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
testarion generate-tests < input.json
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
testarion generate-tests < input.json  # Key automatically loaded from config file
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
testarion crawl https://example.com --rate-limit 3.0
```

### Empty crawl results

- Check that the URL is accessible
- Verify the site doesn't block automated requests
- Try running with `--verbose` for more details

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [O'Saasy License](LICENSE) - MIT with SaaS rights reserved.
