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

- Discovers all accessible pages starting from a URL
- Identifies forms, buttons, and input fields
- Respects robots.txt rules
- Implements rate limiting
- Provides real-time progress updates
- Outputs results in JSON or human-readable text format
- Handles interruptions gracefully

## Requirements

- Node.js >= 18.0.0
- TypeScript 5.x

