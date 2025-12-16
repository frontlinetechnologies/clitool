# Research: Web Crawler Implementation

**Feature**: Crawl a Web Application  
**Date**: 2024-12-16  
**Phase**: 0 - Research & Technology Selection

## Technology Decisions

### Decision: Use Playwright for Browser Automation

**Rationale**: 
- Constitution requires Playwright compatibility (Article IV)
- Handles JavaScript-rendered content that static HTML parsers miss
- Provides robust page navigation and element extraction APIs
- Cross-platform support aligns with Article VII
- Foundation for future test generation features

**Alternatives Considered**:
- **Puppeteer**: Similar capabilities but Playwright is constitution-mandated
- **Cheerio + HTTP client**: Faster but misses JavaScript-rendered content, violates assumption that tool handles standard HTML (not SPAs)
- **Headless Chrome directly**: Lower-level, more complex, Playwright provides better abstraction

**Implementation Notes**: Use Playwright's page.goto() and page.content() for page loading, page.evaluate() for element extraction.

---

### Decision: Use Cheerio for HTML Parsing

**Rationale**:
- Lightweight, server-side jQuery implementation
- Fast HTML parsing for extracting forms, buttons, inputs
- Works with HTML strings (from Playwright page.content())
- Minimal dependency footprint (Article VI compliance)

**Alternatives Considered**:
- **jsdom**: More heavyweight, includes DOM simulation we don't need
- **htmlparser2**: Lower-level, requires more code
- **Playwright selectors only**: Possible but Cheerio provides cleaner extraction logic

**Implementation Notes**: Parse HTML from Playwright, extract elements using Cheerio selectors.

---

### Decision: Use robots-parser for robots.txt Compliance

**Rationale**:
- Standard library for parsing robots.txt files
- Handles edge cases (malformed files, caching, user-agent matching)
- Minimal dependency, well-maintained
- Required for FR-007 and FR-008

**Alternatives Considered**:
- **Custom parser**: More code to maintain, edge cases to handle
- **Ignore robots.txt**: Violates web crawling best practices and requirements

**Implementation Notes**: Fetch robots.txt before crawling, parse with robots-parser, check each URL before crawling.

---

### Decision: Use Commander.js for CLI Interface

**Rationale**:
- Standard Node.js CLI framework
- Provides argument parsing, help text generation, option flags
- Supports subcommands (future extensibility)
- Article IX compliance (CLI help text as primary documentation)

**Alternatives Considered**:
- **yargs**: Similar functionality, Commander is more widely adopted
- **minimist**: Too low-level, requires more boilerplate
- **Custom argument parsing**: Unnecessary complexity

**Implementation Notes**: Single command `crawl <url>` with optional flags: `--quiet`, `--rate-limit`, `--output-format`, `--verbose`.

---

### Decision: URL Normalization Strategy

**Rationale**:
- FR-021 requires normalization and deduplication
- Standard approach: normalize trailing slashes, remove fragments, preserve query strings
- Use Node.js `url` module for parsing, custom normalization logic

**Implementation Notes**:
- Normalize trailing slashes: `/page` and `/page/` → `/page/`
- Remove URL fragments: `/page#section` → `/page`
- Preserve query strings: `/page?param=value` → `/page?param=value`
- Use normalized URL as key for deduplication

---

### Decision: Rate Limiting Implementation

**Rationale**:
- FR-009 requires configurable delays between requests
- Default 1-2 seconds per spec assumptions
- Simple delay-based approach sufficient (not token bucket needed)

**Implementation Notes**:
- Configurable delay (default: 1.5 seconds)
- Await delay after each page request
- Handle 429 responses with exponential backoff
- Rate limiting applies to same-domain requests only

---

### Decision: Progress Reporting Approach

**Rationale**:
- FR-020 requires real-time progress updates
- Use console output with carriage return for in-place updates
- Quiet mode suppresses progress (FR-020)

**Implementation Notes**:
- Display: `Crawling... [X pages discovered] Current: <url>`
- Update same line using `\r` carriage return
- Quiet mode: no progress, only final summary
- Progress updates don't interfere with JSON output (separate streams)

---

### Decision: Interruption Handling

**Rationale**:
- FR-022 requires saving partial results on interruption
- Use Node.js signal handlers (SIGINT, SIGTERM)
- Graceful shutdown: save current state, output results, exit

**Implementation Notes**:
- Listen for SIGINT (Ctrl+C) and SIGTERM
- Set flag to stop crawling gracefully
- Output current crawl summary on interruption
- Clear error handling to prevent data loss

---

### Decision: Output Format Structure

**Rationale**:
- JSON format required (FR-010, clarification)
- Optional human-readable text (FR-019)
- Structured JSON enables programmatic consumption

**Implementation Notes**:
```json
{
  "summary": {
    "totalPages": 42,
    "totalForms": 15,
    "totalButtons": 28,
    "totalInputFields": 45,
    "errors": 3,
    "interrupted": false
  },
  "pages": [...],
  "forms": [...],
  "buttons": [...],
  "inputFields": [...]
}
```

---

## Integration Patterns

### Playwright + Cheerio Workflow

1. Use Playwright to load page (handles JavaScript, redirects)
2. Extract HTML content via `page.content()`
3. Parse HTML with Cheerio
4. Extract elements using Cheerio selectors
5. Store results in memory models

### robots.txt Integration

1. Fetch `/robots.txt` before starting crawl
2. Parse with robots-parser
3. Check each discovered URL against robots.txt rules
4. Skip disallowed paths before crawling

### Rate Limiting Integration

1. After each page request, await configured delay
2. Track request timestamps for same domain
3. On 429 response, implement exponential backoff
4. Continue with next page after delay/backoff

---

## Performance Considerations

- **Memory**: Store discovered pages/elements in memory (acceptable for 1000-page limit)
- **Concurrency**: Sequential crawling (rate limiting requirement) - no parallel requests
- **Timeout**: Set reasonable timeouts for page loads (30s default)
- **Error Recovery**: Continue crawling after errors, log and include in summary

---

## Security Considerations

- Validate input URLs (prevent SSRF)
- Respect robots.txt (legal compliance)
- Rate limiting (prevent DoS on target site)
- No credential storage (public pages only per assumptions)

---

## Testing Strategy

- **Unit Tests**: Parsers, URL normalization, rate limiter, formatters
- **Integration Tests**: Full crawl flow with mock HTTP server
- **Fixtures**: Sample HTML pages with forms, buttons, inputs
- **Coverage**: Minimum 80% (Article VIII)

---

## Open Questions Resolved

✅ All NEEDS CLARIFICATION items from spec resolved via clarifications session  
✅ Technology stack aligned with constitution requirements  
✅ Performance targets defined (30 minutes for 1000 pages)  
✅ Output format clarified (JSON with optional text)

