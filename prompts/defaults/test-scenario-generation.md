---
name: test-scenario-generation
version: 2.0.0
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

## CRITICAL RULES - You MUST Follow These

### What Makes a GOOD Test:
1. Tests observable user outcomes (URL changes, messages appear, elements show/hide)
2. Uses Playwright's auto-retrying assertions (toBeVisible, toHaveURL, toHaveText)
3. Verifies that something CHANGED after an action
4. Tests edge cases: empty inputs, invalid data, boundary conditions

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

## Scenario Ideas by Flow Type

**Login flows:** Test invalid credentials, empty fields, account lockout messages
**Checkout flows:** Test invalid card, missing fields, price calculation, shipping validation
**Form submission:** Test required field validation, character limits, format validation
**Registration:** Test duplicate email, password requirements, terms checkbox
**Search:** Test empty results, special characters, filter combinations

Now generate 1-2 high-quality test scenarios for the flow described above.
