---
name: test-scenario-generation
version: 2.1.0
description: Generates high-quality Playwright E2E test scenarios with proper assertions and locators
max_tokens: 2000
variables:
  - name: flow_type
    required: true
    description: Type of user flow (login, checkout, form-submission, registration, search)
  - name: pages
    required: true
    description: Pages in the flow, joined with ' -> '
  - name: form_fields
    required: true
    description: Form fields involved in the flow, joined with ', '
  - name: page_elements
    required: false
    description: Available interactive elements (buttons, links, headings) found on pages
  - name: available_selectors
    required: false
    description: data-testid and aria-label values found on pages
---

Generate Playwright E2E test scenarios for this web flow.

## Context

**Flow Type:** {{flow_type}}
**Pages:** {{pages}}
**Form Fields:** {{form_fields}}
{{#if page_elements}}**Interactive Elements:** {{page_elements}}{{/if}}
{{#if available_selectors}}**Available Selectors:** {{available_selectors}}{{/if}}

## Your Task

Generate 1-2 additional test scenarios that would catch real bugs. Focus on scenarios the pattern-based generator might miss.

## Test Quality Standards

A senior QA engineer would ONLY keep tests that:
1. **Protect revenue**: Catch bugs that would cost money (checkout, payments)
2. **Block users**: Detect issues that prevent users from completing goals
3. **Verify data integrity**: Ensure user data is correctly saved/processed
4. **Test real scenarios**: Reflect actual user behavior, not theoretical edge cases

Skip tests for: cosmetic elements, static content pages, features with low user impact.

## CRITICAL RULES - You MUST Follow These

### What Makes a GOOD Test:
1. Tests observable user outcomes (URL changes, messages appear, elements show/hide)
2. Uses Playwright's auto-retrying assertions (toBeVisible, toHaveURL, toHaveText)
3. Verifies that something CHANGED after an action
4. Tests edge cases: empty inputs, invalid data, boundary conditions
5. Tests ONE behavior per test (granular, isolated verification)
6. Has a descriptive name that explains what breaks if this fails
7. Focuses on business-critical flows over cosmetic features
8. Produces clear failure evidence (specific assertion message)

### What Makes a BAD Test (NEVER generate these):
1. Trivial assertions: `expect(true).toBe(true)` - NEVER do this
2. Tautological checks: asserting a value equals itself
3. Implementation details: checking CSS classes, internal state, or data attributes for non-functional purposes
4. Redundant tests: duplicating what other tests already cover
5. Tests without meaningful assertions
6. Hard-coded waits: use Playwright's built-in waiting instead

### Meaningful Assertion Examples:
- GOOD: After login, URL contains "/dashboard"
- GOOD: Error message "Invalid email" is visible after submitting bad data
- GOOD: Submit button becomes disabled after click
- GOOD: Success toast appears with text "Saved"
- BAD: Page element exists (too vague)
- BAD: Form is on page (trivial)
- BAD: expect(true).toBe(true) (meaningless)

## Test Data Strategy (Production/Staging Reality)

Since tests run on production or staging (no database reset), use these strategies:

### For Independent Tests:
- Use unique identifiers (timestamp-based emails: `test-{timestamp}@example.com`)
- Create prerequisites via API before UI steps when possible
- Query existing state before asserting (don't assume specific values)

### For Dependent User Flows:
When a flow requires sequential steps (create → use → verify), group them in ONE test:
```
test('complete purchase flow', async () => {
  // Step 1: Create account (prerequisite)
  // Step 2: Add item to cart
  // Step 3: Complete checkout
  // Step 4: Verify order in history
});
```

This is BETTER than separate tests with hidden dependencies.

### Anti-patterns to avoid:
- BAD: Test B silently expects Test A to have run first
- BAD: Test uses hard-coded data that may not exist
- BAD: Test modifies shared data other tests depend on
- GOOD: Explicit flow tests that create their own data
- GOOD: Tests that use dedicated test accounts

## Flakiness Prevention

### Locator Resilience
When element might have multiple valid locators, prefer this cascade:
1. Role with accessible name: `getByRole('button', { name: 'Submit' })`
2. Explicit test ID: `getByTestId('checkout-submit')`
3. Unique visible text: `getByText('Complete Purchase')`

Avoid: Generic CSS selectors, XPath, nth-child, class names.

### Async Handling
- ALWAYS wait for network idle or specific element before asserting
- NEVER use fixed delays (`page.waitForTimeout(1000)` is FORBIDDEN)
- Use `expect(locator).toBeVisible()` which auto-retries
- For dynamic content, wait for specific condition: `await expect(locator).toHaveText('Loaded')`

### Timing-Safe Assertions
- BAD: Check element exists immediately after click
- GOOD: Wait for observable outcome (URL change, new element visible, text appears)

## Output Format

Return a JSON array. Each scenario must have:
- Concrete steps with proper locator strategies
- Assertions that verify OBSERVABLE OUTCOMES

```json
[
  {
    "name": "descriptive test name - explains what breaks if this fails",
    "description": "What user behavior this tests and why it matters",
    "steps": [
      {
        "action": "goto",
        "target": "/login"
      },
      {
        "action": "fill",
        "locatorType": "label",
        "locatorValue": "Email",
        "value": "invalid-email"
      },
      {
        "action": "click",
        "locatorType": "role",
        "locatorValue": "button",
        "options": { "name": "Sign In" }
      }
    ],
    "assertions": [
      {
        "type": "visible",
        "locatorType": "text",
        "locatorValue": "Please enter a valid email"
      },
      {
        "type": "url",
        "expected": "/login",
        "description": "User should stay on login page after validation error"
      }
    ]
  }
]
```

## Locator Types (in priority order)

Use the most stable locator available:

1. **role** - `getByRole('button', { name: 'Submit' })` - Best for buttons, links, headings
2. **label** - `getByLabel('Email')` - Best for form fields with labels
3. **placeholder** - `getByPlaceholder('Enter email')` - For fields with placeholder text
4. **text** - `getByText('Welcome')` - For visible text content
5. **testid** - `getByTestId('submit-btn')` - Only if data-testid is available
6. **name** - `locator('[name="email"]')` - Last resort for form fields

## Assertion Types

- **url** - Page URL matches pattern: `await expect(page).toHaveURL(/pattern/)`
- **visible** - Element is visible: `await expect(locator).toBeVisible()`
- **hidden** - Element is not visible: `await expect(locator).toBeHidden()`
- **text** - Element contains text: `await expect(locator).toContainText('text')`
- **value** - Input has value: `await expect(locator).toHaveValue('value')`
- **enabled** - Element is enabled: `await expect(locator).toBeEnabled()`
- **disabled** - Element is disabled: `await expect(locator).toBeDisabled()`
- **title** - Page title matches: `await expect(page).toHaveTitle(/pattern/)`

## Avoid Redundant Coverage

The pattern-based generator already creates:
- Navigation tests for each page (URL + title assertions)
- Basic form submission tests (fill all fields, submit, check redirect)
- Login flow tests (valid credentials → dashboard)
- Checkout flow tests (valid payment → confirmation)

Your AI-generated tests should COMPLEMENT, not duplicate:
- DO: Test invalid inputs, error messages, edge cases
- DO: Test multi-step validation (field A affects field B)
- DO: Test interruption scenarios (back button, refresh mid-flow)
- DON'T: Repeat "can navigate to page" tests
- DON'T: Repeat "form submits successfully" if already covered

## Assertion Messages

Every assertion SHOULD include a description explaining the expected behavior:
```json
{
  "type": "visible",
  "locatorType": "text",
  "locatorValue": "Invalid email format",
  "description": "Error message should appear when email lacks @ symbol"
}
```

Good descriptions answer: "What user expectation is violated if this fails?"

## High-Value Scenario Ideas by Flow Type

**Login flows:**
- Invalid email format → specific error message visible
- Valid email + wrong password → "incorrect password" (not generic "invalid credentials")
- Empty email + any password → email required error, password field untouched
- Successful login → redirect to dashboard, user menu appears

**Checkout flows:**
- Expired card (test card 4000000000000069) → expiry error visible
- Insufficient funds (test card 4000000000009995) → decline message
- Empty required field → specific field error, form NOT submitted
- Back button mid-checkout → cart preserved, can resume

**Form submission:**
- Character limit exceeded → truncation or error message
- Required field empty → inline validation before submit
- Invalid format (email, phone) → format-specific error message
- Successful submission → confirmation message/page, form cleared

**Registration:**
- Duplicate email → "email already registered" error
- Password too weak → specific password requirements shown
- Password mismatch → mismatch error, submit disabled
- Terms unchecked → cannot submit, checkbox highlighted

**Search:**
- Empty query → handled gracefully (no results or prompt)
- No results found → helpful message, suggestions if applicable
- Special characters → sanitized, no errors

Now generate 1-2 high-quality test scenarios for the flow described above.
