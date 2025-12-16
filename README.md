# @testarion/clitool

CLI tool for crawling web applications to discover pages, forms, buttons, and input fields.

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

### Basic Crawl

```bash
crawl https://example.com
```

### Options

- `--quiet`: Suppress progress updates
- `--format <json|text>`: Output format (default: json)
- `--verbose`: Include detailed information
- `--rate-limit <seconds>`: Delay between requests in seconds (default: 1.5)
- `--output <file>`: Save results to file

### Examples

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
# Generate documentation from crawl results (piped)
crawl https://example.com | generate-docs

# Save documentation to file
crawl https://example.com | generate-docs --output docs.md

# Generate from existing crawl results file
cat crawl-results.json | generate-docs

# With AI descriptions (requires ANTHROPIC_API_KEY environment variable)
export ANTHROPIC_API_KEY=your-api-key
crawl https://example.com | generate-docs --output docs.md
```

### Generate Docs Options

- `--output <file>`: Save documentation to file instead of stdout

The `generate-docs` command reads crawl results JSON from stdin and generates comprehensive Markdown documentation including:
- Site structure and navigation paths
- Critical user flows (login, checkout, form submissions)
- Page details with forms, buttons, and input fields
- AI-generated page descriptions (when API key is available)

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

## Features

### Crawl Command

- Discovers all accessible pages starting from a URL
- Identifies forms, buttons, and input fields
- Respects robots.txt rules
- Implements rate limiting
- Provides real-time progress updates
- Outputs results in JSON or human-readable text format
- Handles interruptions gracefully

### Generate Docs Command

- Generates human-readable Markdown documentation from crawl results
- Identifies site structure and navigation paths
- Detects critical user flows (login, checkout, form submissions)
- Provides AI-powered page descriptions (requires ANTHROPIC_API_KEY)
- Handles empty results gracefully
- Outputs to stdout or file

## Requirements

- Node.js >= 18.0.0
- TypeScript 5.x

