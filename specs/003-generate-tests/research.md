# Research: End-to-End Test Generation

**Feature**: Generate End-to-End Tests  
**Date**: 2025-12-16  
**Phase**: 0 - Research & Technology Selection

## Technology Decisions

### Decision: Use @playwright/test for Generated Test Code

**Rationale**: 
- Spec requires valid Playwright test scripts (FR-002, Article IV)
- @playwright/test is already in devDependencies
- Standard Playwright API ensures compatibility and extensibility
- Follows Playwright best practices for maintainable tests
- Self-contained test files that can run independently

**Alternatives Considered**:
- **Custom test format**: Violates Article IV (Playwright Compatibility), users expect standard Playwright
- **Other test frameworks (Cypress, Selenium)**: Spec and constitution require Playwright specifically
- **Playwright MCP**: Constitution mentions MCP but standard Playwright API is simpler and more reliable

**Implementation Notes**: 
- Generate TypeScript test files (`.spec.ts` extension)
- Use `@playwright/test` imports: `import { test, expect } from '@playwright/test'`
- Follow Playwright test structure: `test.describe()` for grouping, `test()` for individual tests
- Use Playwright locators: `page.getByRole()`, `page.getByLabel()`, `page.getByPlaceholder()`
- Include proper test setup/teardown if needed
- Ensure generated code passes TypeScript compilation and linting

---

### Decision: Playwright Test Code Generation Strategy

**Rationale**:
- Template-based code generation provides control and consistency
- String templates (template literals) sufficient for structured code generation
- No need for AST manipulation (overkill for this use case)
- Simple, maintainable approach aligns with Article I (Simplicity First)

**Alternatives Considered**:
- **AST manipulation (Babel/TypeScript compiler API)**: Complex, harder to maintain, template strings sufficient
- **Code generation library**: Adds dependency, template strings are native and sufficient
- **Playwright Codegen output parsing**: Codegen produces verbose code, we need cleaner, focused tests

**Implementation Notes**:
- Use TypeScript template literals for code generation
- Create reusable code templates for common patterns:
  - Navigation tests: `page.goto()`, `expect(page).toHaveTitle()`
  - Form filling: `page.getByLabel()`, `page.fill()`, `page.click()`
  - Form submission: `page.getByRole('button', { name: 'Submit' })`, `page.click()`
  - Assertions: `expect(page).toHaveURL()`, `expect(page.locator()).toBeVisible()`
- Generate clean, readable code following Playwright best practices
- Include comments explaining test purpose when helpful
- Ensure proper indentation and formatting

---

### Decision: Test Data Generation Approach

**Rationale**:
- Spec requires generating appropriate test data (FR-019)
- Realistic test data improves test quality and reliability
- Pattern-based generation covers common input types
- Can be enhanced with AI for context-specific data

**Alternatives Considered**:
- **Hard-coded test data**: Inflexible, doesn't adapt to different sites
- **Random data generation**: Less reliable, harder to debug
- **User-provided test data**: Adds complexity, violates zero-config principle
- **AI-only data generation**: Slower, more expensive, pattern-based approach sufficient for most cases

**Implementation Notes**:
- **Email fields**: Generate realistic test emails (e.g., `test.user@example.com`)
- **Password fields**: Generate secure test passwords (e.g., `TestPassword123!`)
- **Text fields**: Use descriptive placeholder text (e.g., `Test Name`, `Test Address`)
- **Number fields**: Use valid test numbers (e.g., `12345`, `100`)
- **Coupon codes**: Generate test coupon codes (e.g., `TESTCOUPON`, `PROMO2024`)
- **Phone numbers**: Generate valid format phone numbers (e.g., `+1-555-123-4567`)
- **Credit card fields**: Use test card numbers (e.g., `4111111111111111` for Visa test card)
- **Dates**: Use valid future dates for date pickers
- Store test data generators in `test-data-generator.ts` module
- Allow AI enhancement for context-specific test data when available

---

### Decision: Test File Organization Strategy

**Rationale**:
- Spec requires one file per user flow (FR-018, clarification Q3)
- Organizing by flow improves maintainability and test discovery
- Matches common Playwright project structure
- Clear naming convention: `{flow-name}-flow.spec.ts`

**Alternatives Considered**:
- **Single file**: Hard to maintain, violates spec requirement
- **One file per page**: Too granular, doesn't match user flows
- **One file per scenario type**: Less intuitive, flows are more meaningful
- **User-defined organization**: Adds complexity, auto-organization works

**Implementation Notes**:
- Generate one `.spec.ts` file per detected user flow
- File naming: Convert flow name to kebab-case (e.g., `Login Flow` → `login-flow.spec.ts`)
- Include all test cases for that flow in the file:
  - Navigation tests
  - Form submission tests
  - Specific scenarios (e.g., coupon codes) within the flow file
- For pages without flows: Generate `navigation.spec.ts` with basic navigation tests
- Organize files in output directory (default: `./tests/generated/`)
- Each file is self-contained and independently runnable

---

### Decision: AI Integration for Test Generation

**Rationale**:
- Spec requires AI to analyze crawl data and generate contextually appropriate tests (FR-004)
- AI can enhance test scenarios beyond pattern matching
- Reuse existing Anthropic client from `generate-docs` feature
- AI provides context-aware test data and assertions

**Alternatives Considered**:
- **Pattern matching only**: Limited, AI provides better context understanding
- **AI-only generation**: Slower, expensive, hybrid approach balances speed and quality
- **Other AI providers**: Spec requires Anthropic (consistent with generate-docs)

**Implementation Notes**:
- Reuse `src/ai/anthropic-client.ts` from existing codebase
- Use AI for:
  - Generating contextually appropriate test scenarios
  - Identifying test assertions based on page content
  - Generating realistic test data for specific fields
  - Detecting edge cases and special scenarios
- Fall back to pattern-based generation when AI unavailable (FR-013)
- Batch AI requests efficiently to respect rate limits
- Cache AI responses during generation to avoid duplicate calls

---

### Decision: Flow Detection Reuse Strategy

**Rationale**:
- Existing `flow-detector.ts` already identifies login, checkout, and form flows
- Reusing existing code follows DRY principle and Article V (Modular Architecture)
- Consistent flow detection across documentation and test generation
- Reduces code duplication and maintenance burden

**Alternatives Considered**:
- **Duplicate flow detection logic**: Violates DRY, increases maintenance
- **AI-only flow detection**: Slower, existing heuristic approach works well
- **Rewrite flow detection**: Unnecessary, existing implementation is solid

**Implementation Notes**:
- Import and reuse `detectCriticalFlows()` from `src/documentation/flow-detector.ts`
- Flow detection provides:
  - Flow type (login, checkout, form-submission)
  - Flow pages with step numbers and roles
  - Flow priority for test generation ordering
- Use detected flows to organize test file generation
- Enhance flows with AI-generated test scenarios when available

---

### Decision: Test Assertion Generation Strategy

**Rationale**:
- Spec requires appropriate assertions in test cases (FR-012)
- Assertions verify expected outcomes and improve test reliability
- Pattern-based assertions cover common scenarios
- AI can enhance assertions for context-specific cases

**Alternatives Considered**:
- **No assertions**: Tests wouldn't verify outcomes, violates FR-012
- **Generic assertions only**: Less valuable, context-specific assertions better
- **AI-only assertions**: Slower, pattern-based approach provides good baseline

**Implementation Notes**:
- **Navigation assertions**: `expect(page).toHaveURL(expectedUrl)`, `expect(page).toHaveTitle(expectedTitle)`
- **Form submission assertions**: `expect(page).toHaveURL(successUrl)`, `expect(page.locator('.success')).toBeVisible()`
- **Element visibility**: `expect(page.getByRole('button')).toBeVisible()`
- **Input field values**: `expect(page.getByLabel('Email')).toHaveValue('test@example.com')`
- **Page load**: `await page.waitForLoadState('networkidle')`
- Generate assertions based on:
  - Flow type (login → dashboard URL, checkout → confirmation page)
  - Form action URLs (redirect expectations)
  - Page structure (key elements to verify)
- Use AI to enhance assertions with context-specific expectations

---

### Decision: Output Directory Handling

**Rationale**:
- Spec requires configurable output directory with default `./tests/generated/` (FR-003, clarification Q1)
- Default directory provides zero-config experience (Article II)
- Directory creation ensures output location exists
- Warning on overwrite provides transparency (Article III)

**Alternatives Considered**:
- **Current directory**: Less organized, default directory better
- **Require directory specification**: Violates zero-config principle
- **Auto-detect from project structure**: Less predictable, explicit default clearer

**Implementation Notes**:
- Default directory: `./tests/generated/` (or `tests/generated/` if `tests/` exists)
- Create directory if it doesn't exist
- Check if directory is writable before generation (FR-015)
- Handle existing files: Display warning, then overwrite (FR-016, clarification Q2)
- Support relative and absolute paths for `--output-dir` option
- Use Node.js `fs` and `path` modules for cross-platform compatibility (Article VII)

---

### Decision: Empty Results and Edge Case Handling

**Rationale**:
- Spec requires graceful handling of edge cases (FR-014, FR-021)
- Empty results should generate minimal test file with explanation
- Pages without forms need basic navigation tests
- Maintains output consistency and user understanding

**Implementation Notes**:
- **Empty crawl results**: Generate `empty-results.spec.ts` with comment explaining no pages found
- **Pages without forms**: Generate basic navigation tests (page load, title verification)
- **Error pages (4xx/5xx)**: Skip or generate tests that verify error page display
- **Circular navigation**: Detect cycles, generate tests that navigate through cycle once
- **Multiple domains**: Filter to same domain as crawl start URL, skip external domains
- **Malformed data**: Validate crawl results schema, handle missing fields gracefully
- **AI unavailable**: Fall back to pattern-based test generation (FR-013)

---

## Integration Patterns

### Crawl Results → Test Generation Pipeline

1. Read JSON from stdin (`process.stdin`)
2. Parse crawl results (validate schema, reuse `parseCrawlResults()`)
3. Detect user flows (reuse `detectCriticalFlows()` from flow-detector)
4. For each detected flow:
   - Generate test file: `{flow-name}-flow.spec.ts`
   - Generate navigation tests for flow pages
   - Generate form submission tests if forms present
   - Detect specific scenarios (coupon codes, etc.) and include in flow file
   - Use AI to enhance test scenarios and assertions (if available)
5. For pages without flows:
   - Generate `navigation.spec.ts` with basic navigation tests
6. Write test files to output directory
7. Display summary of generated files

### Playwright Test Code Structure

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

### Test Data Generation Patterns

- **Email**: `test.user@example.com`, `user123@test.com`
- **Password**: `TestPassword123!`, `SecurePass456@`
- **Text**: `Test Name`, `Test Address`, `Test Company`
- **Phone**: `+1-555-123-4567`, `555-123-4567`
- **Credit Card**: `4111111111111111` (Visa test), `5555555555554444` (Mastercard test)
- **Coupon Code**: `TESTCOUPON`, `PROMO2024`, `DISCOUNT10`
- **Date**: Future dates in valid format (e.g., `2025-12-31`)

### AI-Enhanced Test Generation

1. For each flow, send flow context to AI:
   - Flow type and pages
   - Forms and input fields
   - Navigation paths
2. AI generates:
   - Additional test scenarios
   - Context-specific test data
   - Appropriate assertions
   - Edge case tests
3. Merge AI suggestions with pattern-based tests
4. Fall back to pattern-based if AI unavailable

---

## Performance Considerations

- **Memory**: Store crawl results and generated test code in memory (acceptable for 1000-page limit)
- **AI API Calls**: Batch requests efficiently, cache responses, sequential processing to respect rate limits
- **Processing Time**: Target <10 minutes for 1000 pages (per FR-017)
- **File Generation**: Generate files sequentially to avoid file system contention
- **Large Results**: Process flows incrementally, avoid loading all pages into memory at once
- **Test File Size**: Keep individual test files reasonable (<500 lines), split if needed

---

## Security Considerations

- **API Key**: Read from environment variable only, never log or expose
- **Input Validation**: Validate crawl results JSON schema before processing
- **File Writing**: Validate output path, check permissions before writing
- **Test Data**: Use safe test data, avoid exposing sensitive patterns
- **Error Handling**: Don't expose API keys or sensitive data in error messages

---

## Testing Strategy

- **Unit Tests**: Test code generators, test data generators, file organizers, flow detection integration
- **Integration Tests**: Full pipeline with mock crawl results, mock Anthropic API, verify generated test files
- **Contract Tests**: Verify generated Playwright code compiles and passes linting
- **Fixtures**: Sample crawl results JSON files with various scenarios (login flows, checkout flows, forms)
- **Coverage**: Minimum 80% (Article VIII)
- **Mock Anthropic API**: Use nock or similar to mock API responses
- **Generated Test Validation**: Run generated tests against test fixtures to verify they work

---

## Open Questions Resolved

✅ All NEEDS CLARIFICATION items from spec resolved via clarifications session  
✅ Technology stack aligned with constitution requirements  
✅ Playwright test code generation approach defined  
✅ Test file organization strategy determined (one file per flow)  
✅ Test data generation patterns established  
✅ Performance targets defined (10 minutes for 1000 pages)  
✅ Empty results handling clarified  
✅ File overwrite behavior specified  
✅ AI integration approach defined (reuse existing client)  
✅ Flow detection reuse strategy determined



