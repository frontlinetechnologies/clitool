# Quick Start: Generate End-to-End Tests

**Feature**: Generate End-to-End Tests  
**Date**: 2025-12-16

## Installation

The `generate-tests` command is part of the `@testarion/clitool` package:

```bash
npm install -g @testarion/clitool
```

## Prerequisites

- Anthropic API key (for AI-enhanced test generation)
- Set environment variable: `export ANTHROPIC_API_KEY=your-api-key`
- Playwright installed in your project (for running generated tests)

**Note**: The tool works without an API key but will generate basic structural tests without AI enhancements.

## Basic Usage

### Generate Tests from Crawl Results

Pipe crawl results to the `generate-tests` command:

```bash
crawl https://example.com | generate-tests
```

This will:
- Read crawl results from stdin
- Detect user flows (login, checkout, forms)
- Identify specific scenarios (coupon codes, etc.)
- Generate Playwright test files (one file per flow)
- Save tests to default directory: `./tests/generated/`

### Specify Output Directory

```bash
crawl https://example.com | generate-tests --output-dir ./e2e-tests
```

### Example Output

The tool generates organized test files:

```
tests/generated/
├── login-flow.spec.ts
├── checkout-flow.spec.ts
├── form-submission-flow.spec.ts
└── navigation.spec.ts
```

### Example Generated Test File

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

## Running Generated Tests

After generating tests, run them with Playwright:

```bash
# Install Playwright if not already installed
npx playwright install

# Run all generated tests
npx playwright test tests/generated/

# Run specific test file
npx playwright test tests/generated/login-flow.spec.ts

# Run tests in headed mode (see browser)
npx playwright test tests/generated/ --headed
```

## Test File Organization

- **One file per user flow**: Each detected flow (login, checkout, etc.) generates its own test file
- **Specific scenarios included**: Scenarios like coupon codes are included in their flow file
- **Navigation tests**: Pages without flows generate basic navigation tests in `navigation.spec.ts`
- **Empty results**: If no pages found, generates `empty-results.spec.ts` with explanation

## Test Types Generated

### Navigation Tests
- Page load verification
- Title assertions
- URL navigation between pages

### Form Submission Tests
- Form field filling
- Form submission
- Success page verification

### Specific Scenario Tests
- Coupon code entry (when detected)
- Promo code application
- Other detected scenarios

### Login Flow Tests
- Login page navigation
- Credential entry
- Authentication verification

### Checkout Flow Tests
- Cart to checkout navigation
- Payment form filling
- Order confirmation

## Customizing Generated Tests

Generated tests are standard Playwright scripts. You can:

- **Modify test data**: Update email addresses, passwords, test values
- **Add assertions**: Include additional verification steps
- **Extend with Playwright APIs**: Use any Playwright feature
- **Add setup/teardown**: Include fixtures, authentication, etc.

## Handling Existing Test Files

If the output directory already contains test files:

- The tool displays a warning message
- Existing files are overwritten with new generated tests
- This allows regenerating tests as your site evolves

## AI Enhancement

When an Anthropic API key is available:

- Tests include contextually appropriate scenarios
- Test data is more realistic and context-aware
- Assertions are enhanced with page-specific expectations
- Edge cases are detected and tested

Without an API key:

- Tests use pattern-based generation
- Basic test scenarios are still generated
- All core functionality works

## Troubleshooting

### Tests fail to run

- Ensure Playwright is installed: `npx playwright install`
- Check that generated test files are valid TypeScript
- Verify page URLs are accessible
- Review test output for specific errors

### No tests generated

- Check that crawl results contain pages
- Verify crawl completed successfully
- Review error messages for issues

### AI enhancement not working

- Verify `ANTHROPIC_API_KEY` environment variable is set
- Check API key is valid and has credits
- Tool falls back to pattern-based generation if AI unavailable

## Next Steps

1. **Review generated tests**: Check that tests cover your critical flows
2. **Customize test data**: Update test values for your application
3. **Add authentication**: Include login/session setup if needed
4. **Run tests**: Execute tests to verify they work
5. **Integrate into CI/CD**: Add tests to your continuous integration pipeline

## Examples

### E-commerce Site

```bash
crawl https://shop.example.com | generate-tests
```

Generates:
- `checkout-flow.spec.ts` - Cart, checkout, payment flow
- `login-flow.spec.ts` - User authentication
- `product-search-flow.spec.ts` - Search and product pages

### SaaS Application

```bash
crawl https://app.example.com | generate-tests --output-dir ./playwright/tests
```

Generates:
- `login-flow.spec.ts` - User login
- `dashboard-flow.spec.ts` - Dashboard navigation
- `settings-flow.spec.ts` - Settings form submission

## Best Practices

1. **Review before running**: Check generated tests before executing
2. **Customize test data**: Use realistic test data for your application
3. **Add authentication**: Include login setup for protected pages
4. **Maintain tests**: Regenerate tests when site structure changes
5. **Version control**: Commit generated tests to track changes



