# Research: Site Documentation Generation

**Feature**: Generate Site Documentation  
**Date**: 2024-12-19  
**Phase**: 0 - Research & Technology Selection

## Technology Decisions

### Decision: Use @anthropic-ai/sdk for Anthropic API Integration

**Rationale**: 
- Spec requires Anthropic AI API for page analysis (FR-007, clarification)
- Official SDK provides type-safe API client
- Handles authentication, request/response formatting, error handling
- Supports streaming responses if needed in future
- Minimal dependency footprint (Article VI compliance)

**Alternatives Considered**:
- **Direct HTTP client (fetch/axios)**: More code to maintain, manual auth handling, no type safety
- **Other AI providers**: Spec explicitly requires Anthropic (Clarification Q4)
- **MCP (Model Context Protocol)**: Constitution mentions MCP but for test generation, not documentation; SDK is simpler for this use case

**Implementation Notes**: 
- Use `ANTHROPIC_API_KEY` environment variable for authentication
- Configure client with API key from environment
- Handle API errors gracefully, fall back to structural documentation
- Rate limiting handled by Anthropic API (no client-side throttling needed initially)

---

### Decision: Markdown Generation Strategy

**Rationale**:
- Spec requires Markdown output (FR-002)
- Markdown is human-readable, version-control friendly, renders well in viewers
- Can use template strings or markdown library for formatting
- Simple structure: headers, lists, code blocks, links

**Alternatives Considered**:
- **Marked/markdown-it library**: Overkill for generation (these are for parsing), template strings sufficient
- **HTML output**: Markdown specified in requirements, HTML less readable in source
- **Custom format**: Markdown is standard, well-supported

**Implementation Notes**:
- Use template strings for Markdown generation (simple, no extra dependency)
- Structure: Title, Summary, Site Structure, Navigation Paths, Critical Flows, Page Details
- Ensure proper Markdown syntax (headers, lists, code blocks, links)
- Test rendering in common Markdown viewers

---

### Decision: Flow Detection Algorithm

**Rationale**:
- Spec requires identifying login, checkout, and form submission flows (FR-005, FR-011, FR-012, FR-013)
- Pattern matching on form fields and page URLs is sufficient (per assumptions)
- Heuristic-based approach faster than AI analysis for flow detection
- Can be enhanced with AI if needed later

**Alternatives Considered**:
- **AI-only flow detection**: Slower, more expensive, heuristic approach sufficient per spec assumptions
- **Complex graph analysis**: Overkill for typical sites, simple pattern matching works
- **User-defined patterns**: Adds complexity, default patterns cover common cases

**Implementation Notes**:
- **Login flow**: Detect pages with password input fields + email/username fields
- **Checkout flow**: Detect pages with payment-related fields (credit card, CVV, billing) or URLs containing "checkout", "cart", "payment"
- **Form submission flows**: Group forms by action URL, trace navigation paths between form pages
- Prioritize flows by form complexity (number of fields) and page importance (home page, high-traffic paths)

---

### Decision: Site Structure Analysis Approach

**Rationale**:
- Spec requires organizing pages into logical sections based on URL patterns (FR-010)
- URL hierarchy provides natural organization
- Link relationships show navigation structure
- Simple tree/graph structure sufficient

**Alternatives Considered**:
- **AI-based organization**: Overkill, URL patterns provide clear structure
- **Complex clustering**: Unnecessary complexity, URL depth sufficient
- **User-defined organization**: Adds configuration complexity, auto-detection works

**Implementation Notes**:
- Parse URL paths to determine depth and hierarchy
- Group pages by URL prefix (e.g., `/products/`, `/about/`, `/contact/`)
- Build navigation graph from page links
- Identify home page (root URL or most linked-to page)
- Represent as hierarchical tree in documentation

---

### Decision: Stdin/Stdout Piping Implementation

**Rationale**:
- Spec requires accepting crawl results via stdin/stdout piping (FR-001, clarification Q1)
- Standard Unix pattern, enables command composition
- Node.js `process.stdin` provides easy access
- Works identically across platforms (Article VII)

**Alternatives Considered**:
- **File input**: Less flexible, requires intermediate files
- **Interactive prompts**: Violates CLI-first principle, breaks automation
- **Auto-detect from default location**: Less explicit, piping is clearer

**Implementation Notes**:
- Read JSON from `process.stdin`
- Parse crawl results JSON matching existing schema
- Validate input format, handle parse errors gracefully
- Output to `process.stdout` by default, or file if `--output` specified
- Handle empty stdin (empty crawl results) per clarification Q5

---

### Decision: Empty Results Handling

**Rationale**:
- Spec requires handling empty crawl results gracefully (FR-015, clarification Q5)
- Generate minimal documentation with explanatory message
- Maintains output format consistency
- User understands what happened

**Implementation Notes**:
- Check if crawl results contain pages
- If empty or no pages, generate minimal Markdown with:
  - Title: "Site Documentation"
  - Message: "No pages were discovered during the crawl."
  - Summary section with zero counts
- Still output to specified location or stdout
- Exit successfully (not an error condition)

---

### Decision: File Overwrite Behavior

**Rationale**:
- Spec requires overwriting existing files with warning (FR-019, clarification Q2)
- Simple behavior, aligns with common CLI patterns
- Warning provides user awareness
- No need for backup or confirmation prompts

**Implementation Notes**:
- Check if output file exists before writing
- If exists, log warning to stderr: "Warning: Overwriting existing file: <path>"
- Proceed with overwrite
- Use `fs.writeFileSync` or async equivalent
- Validate file is writable before starting generation (FR-016)

---

## Integration Patterns

### Crawl Results → Documentation Pipeline

1. Read JSON from stdin (`process.stdin`)
2. Parse crawl results (validate schema)
3. Analyze site structure (URL patterns, navigation graph)
4. Detect critical flows (login, checkout, forms)
5. For each page (if AI available):
   - Call Anthropic API with page content
   - Generate human-readable description
   - Fall back to structural info if API unavailable
6. Format as Markdown
7. Write to stdout or file

### Anthropic API Integration

1. Initialize client with `ANTHROPIC_API_KEY` from environment
2. For each page with content:
   - Build prompt with page HTML/title/URL
   - Call API (Claude model)
   - Extract description from response
   - Handle errors gracefully (fall back to structural info)
3. Batch processing: Process pages sequentially to respect rate limits
4. Cache results in memory during generation

### Flow Detection Algorithm

1. **Login Flow Detection**:
   - Find pages with password input fields
   - Check for email/username fields on same page
   - Group related pages (login form → dashboard redirect)
   - Document as "Login Flow"

2. **Checkout Flow Detection**:
   - Find pages with payment-related fields (credit card, CVV, billing)
   - Check URLs for "checkout", "cart", "payment" keywords
   - Trace navigation from cart → checkout → confirmation
   - Document as "Checkout Flow"

3. **Form Submission Flow Detection**:
   - Group forms by action URL
   - Trace navigation paths between form pages
   - Document multi-step form flows

### Markdown Structure

```markdown
# Site Documentation

## Summary
- Total Pages: X
- Critical Flows: Y
- Forms: Z

## Site Structure
### Home
- /about
- /contact

### Products
- /products/item1
- /products/item2

## Navigation Paths
[Home] → [About] → [Contact]
[Home] → [Products] → [Product Detail]

## Critical User Flows

### Login Flow
1. /login (form with email/password)
2. /dashboard (redirect after login)

### Checkout Flow
1. /cart
2. /checkout (payment form)
3. /confirmation

## Page Details
### /home
**Description**: [AI-generated or structural]
**Forms**: 2
**Buttons**: 5
...
```

---

## Performance Considerations

- **Memory**: Store crawl results in memory (acceptable for 1000-page limit)
- **AI API Calls**: Sequential processing to respect rate limits, batch if possible
- **Processing Time**: Target <5 minutes for 1000 pages (per FR-017)
- **Large Results**: Stream processing if needed, avoid loading all pages into memory at once
- **Caching**: Cache AI responses during generation (avoid duplicate API calls)

---

## Security Considerations

- **API Key**: Read from environment variable only, never log or expose
- **Input Validation**: Validate crawl results JSON schema before processing
- **File Writing**: Validate output path, check permissions before writing
- **Error Handling**: Don't expose API keys or sensitive data in error messages

---

## Testing Strategy

- **Unit Tests**: Flow detection algorithms, markdown formatting, structure analysis
- **Integration Tests**: Full pipeline with mock crawl results, mock Anthropic API
- **Fixtures**: Sample crawl results JSON files with various scenarios
- **Coverage**: Minimum 80% (Article VIII)
- **Mock Anthropic API**: Use nock or similar to mock API responses

---

## Open Questions Resolved

✅ All NEEDS CLARIFICATION items from spec resolved via clarifications session  
✅ Technology stack aligned with constitution requirements  
✅ Anthropic API integration approach defined  
✅ Flow detection strategy determined  
✅ Performance targets defined (5 minutes for 1000 pages)  
✅ Empty results handling clarified  
✅ File overwrite behavior specified

