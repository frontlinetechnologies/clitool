# Quick Start: Generate Site Documentation

**Feature**: Generate Site Documentation  
**Date**: 2024-12-19

## Installation

The `generate-docs` command is part of the `@testarion/clitool` package:

```bash
npm install -g @testarion/clitool
```

## Prerequisites

- Anthropic API key (for AI-generated page descriptions)
- Set environment variable: `export ANTHROPIC_API_KEY=your-api-key`

**Note**: The tool works without an API key but will only generate structural documentation without AI-generated descriptions.

## Basic Usage

### Generate Documentation from Crawl Results

Pipe crawl results to the `generate-docs` command:

```bash
crawl https://example.com | generate-docs
```

This will:
- Read crawl results from stdin
- Analyze site structure and navigation paths
- Identify critical user flows (login, checkout, forms)
- Generate AI-powered page descriptions (if API key available)
- Output Markdown documentation to stdout

### Save Documentation to File

```bash
crawl https://example.com | generate-docs --output docs.md
```

### Example Output

The generated Markdown documentation includes:

```markdown
# Site Documentation

## Summary
- Total Pages: 42
- Critical Flows: 3
- Forms: 15
- Buttons: 28
- Input Fields: 45

## Site Structure

### Home
- /about
- /contact
- /products

### Products
- /products/item1
- /products/item2

## Navigation Paths

[Home] → [About] → [Contact]
[Home] → [Products] → [Product Detail] → [Add to Cart]

## Critical User Flows

### Login Flow
1. **/login** - Login page with email and password fields
   - Form: POST /api/login
   - Redirects to /dashboard after successful login

2. **/dashboard** - User dashboard (protected page)

### Checkout Flow
1. **/cart** - Shopping cart page
2. **/checkout** - Checkout form with payment fields
3. **/confirmation** - Order confirmation page

## Page Details

### /home
**Description**: Homepage with navigation menu and featured products.

**Forms**: 1
- Search form (GET /search)

**Buttons**: 5
- "Sign In" button
- "Add to Cart" buttons (3)
- "View Details" button

**Links**: /about, /contact, /products
```

## Command Options

### Output to File

```bash
crawl https://example.com | generate-docs --output site-docs.md
```

### Quiet Mode

Suppress progress messages (useful for scripting):

```bash
crawl https://example.com | generate-docs --quiet --output docs.md
```

**Note**: Currently, `generate-docs` doesn't have a quiet flag, but this may be added in future versions.

## Examples

### Example 1: Basic Documentation Generation

```bash
crawl https://myapp.com | generate-docs
```

Outputs Markdown documentation to stdout.

### Example 2: Save to File

```bash
crawl https://myapp.com | generate-docs --output documentation.md
```

Saves documentation to `documentation.md` file.

### Example 3: Overwrite Existing File

```bash
crawl https://myapp.com | generate-docs --output docs.md
# Warning: Overwriting existing file: docs.md
```

If the output file already exists, it will be overwritten with a warning message.

### Example 4: Without AI API Key

```bash
crawl https://myapp.com | generate-docs --output docs.md
# Documentation generated with structural information only
# (AI descriptions unavailable - set ANTHROPIC_API_KEY for enhanced descriptions)
```

The tool will generate documentation based on structural data from crawl results, without AI-generated descriptions.

## Error Handling

The tool handles various error scenarios:

- **Empty crawl results**: Generates minimal documentation with message explaining no pages were found
- **Invalid JSON input**: Exits with error message explaining input format issue
- **AI API unavailable**: Falls back to structural documentation, continues generation
- **File write errors**: Validates file is writable before starting, exits with error if not writable
- **Malformed crawl data**: Handles missing fields gracefully, includes available data

## Best Practices

1. **Set API Key**: Export `ANTHROPIC_API_KEY` environment variable for AI-generated descriptions
2. **Save Output**: Use `--output` flag to save documentation for review
3. **Review Critical Flows**: Check the "Critical User Flows" section to understand key user journeys
4. **Check Navigation**: Review "Navigation Paths" to understand site structure
5. **Regenerate Regularly**: Re-run documentation generation as your site evolves

## Limitations

- **AI API Required**: AI-generated descriptions require Anthropic API key (structural documentation works without it)
- **Large Sites**: Very large crawl results (1000+ pages) may take up to 5 minutes to process
- **API Rate Limits**: Anthropic API rate limits apply; tool processes pages sequentially
- **Memory Usage**: Large crawl results are processed in memory (acceptable for typical sites)

## Next Steps

After generating documentation, you can:

- Review site structure and navigation paths
- Identify critical user flows for testing
- Use documentation to plan test generation (future feature)
- Share documentation with team members
- Version control documentation alongside code

## Troubleshooting

### "No pages were discovered during the crawl"

This means the crawl results are empty. Check that:
- The crawl command completed successfully
- The crawl discovered pages (check crawl output)
- The crawl results are being piped correctly

### "AI API unavailable" warnings

If you see warnings about AI API:
- Check that `ANTHROPIC_API_KEY` environment variable is set
- Verify API key is valid
- Check network connectivity
- Documentation will still be generated with structural information

### "File is not writable" error

If you get a file write error:
- Check file permissions
- Ensure directory exists
- Check disk space
- Try a different output path

