# Quick Start: Web Crawler

**Feature**: Crawl a Web Application  
**Date**: 2024-12-16

## Installation

```bash
npm install -g @testarion/clitool
```

## Basic Usage

### Crawl a Website

```bash
crawl https://example.com
```

This will:
- Discover all accessible pages starting from the provided URL
- Identify forms, buttons, and input fields
- Respect robots.txt rules
- Output JSON summary to stdout

### Output Format

By default, the tool outputs JSON:

```json
{
  "summary": {
    "totalPages": 42,
    "totalForms": 15,
    "totalButtons": 28,
    "totalInputFields": 45,
    "errors": 3,
    "skipped": 2,
    "interrupted": false,
    "startTime": "2024-12-16T10:00:00Z",
    "endTime": "2024-12-16T10:15:30Z",
    "duration": 930
  },
  "pages": [...],
  "forms": [...],
  "buttons": [...],
  "inputFields": [...]
}
```

## Command Options

### Quiet Mode

Suppress progress updates (useful for scripting):

```bash
crawl https://example.com --quiet
```

### Human-Readable Output

Output formatted text summary instead of JSON:

```bash
crawl https://example.com --format text
```

### Verbose Mode

Include detailed information about each page and element:

```bash
crawl https://example.com --verbose
```

### Custom Rate Limit

Configure delay between requests (in seconds):

```bash
crawl https://example.com --rate-limit 2.5
```

Default is 1.5 seconds.

### Save Output to File

```bash
crawl https://example.com --output results.json
```

## Examples

### Example 1: Basic Crawl

```bash
crawl https://myapp.com
```

Outputs JSON summary with all discovered pages and elements.

### Example 2: Quiet Mode with File Output

```bash
crawl https://myapp.com --quiet --output crawl-results.json
```

Runs silently and saves results to file.

### Example 3: Text Summary

```bash
crawl https://myapp.com --format text
```

Outputs human-readable summary:

```
Crawl Summary
=============
Total Pages: 42
Total Forms: 15
Total Buttons: 28
Total Input Fields: 45
Errors: 3
Skipped: 2
Duration: 15m 30s

Pages:
  - https://myapp.com/
  - https://myapp.com/about
  - https://myapp.com/contact
  ...
```

### Example 4: Interrupted Crawl

If you press Ctrl+C during a crawl, the tool will:
- Stop crawling gracefully
- Save all discovered pages and elements up to that point
- Output partial results with `interrupted: true` in summary
- Exit with status code 130

## Progress Updates

During crawling, you'll see real-time progress:

```
Crawling... [15 pages discovered] Current: https://example.com/products
```

Use `--quiet` to suppress these updates.

## Error Handling

The tool handles various error scenarios:

- **Invalid URL**: Exits with error message
- **Network errors**: Continues crawling, logs errors in summary
- **403/404/500 responses**: Skips page, includes in error count
- **robots.txt disallowed**: Skips paths, includes in skipped count
- **Interruption (Ctrl+C)**: Saves partial results and exits

## Best Practices

1. **Start with a small site**: Test on a small site first to understand output format
2. **Use quiet mode for automation**: Suppress progress when scripting
3. **Respect rate limits**: Default 1.5s is usually sufficient, increase for fragile sites
4. **Check robots.txt**: Tool respects it automatically, but verify site policies
5. **Save output**: Use `--output` flag to save results for analysis

## Limitations

- Crawls publicly accessible pages only (no authentication)
- Focuses on same-domain pages (skips external links)
- May miss JavaScript-rendered content that requires user interaction
- Large sites (1000+ pages) may take 30+ minutes

## Next Steps

After crawling, you can:
- Analyze the JSON output programmatically
- Use discovered forms/buttons for test generation (future feature)
- Export results to other formats (future feature)
- Generate sitemap from discovered pages (future feature)

