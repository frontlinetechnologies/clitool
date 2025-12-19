---
name: test-data-generation
version: 2.1.0
description: Generates realistic, unique test values for form fields that are suitable for automated testing
max_tokens: 150
variables:
  - name: field_type
    required: true
    description: Type of the field (email, password, text, phone, credit_card, date, number, etc.)
  - name: context
    required: true
    description: Additional context about the field (name, placeholder, validation rules, min/max length, etc.)
  - name: test_type
    required: false
    description: Type of test - valid (default), invalid, edge_case, or boundary
  - name: userContext
    required: false
    description: User-provided context for additional guidance
---

Generate a test value for a {{field_type}} field.

{{#if userContext}}
### Additional Context:
{{userContext}}
{{/if}}

**Context:** {{context}}
{{#if test_type}}**Test Type:** {{test_type}}{{/if}}

## Requirements

1. **Realistic but unique** - Use values that look real but won't conflict with production data
   - Emails: Use @example.com, @test.com, or +test suffixes
   - Names: Use obvious test names like "Test User" or "Jane Tester"
   - Phone: Use clearly fake numbers (555-xxx-xxxx pattern)

2. **Test-appropriate** - Values should be suitable for automated testing
   - Avoid special characters that might break test frameworks
   - Use consistent formats that are easy to verify
   - Include timestamp or random elements to avoid collisions

3. **Match validation rules** - If context mentions validation (min length, pattern, etc.), respect it

4. **For edge case tests** (if test_type is "edge_case" or "boundary"):
   - Empty string for required field testing
   - Minimum/maximum length values
   - Special characters: `<script>`, `'; DROP TABLE`, `\n\r`, unicode chars
   - Boundary numbers: 0, -1, MAX_INT, very long decimals

## Examples by Field Type

- **email**: `test.user.1702856400@example.com`
- **password**: `Test@Pass123!` (meets typical requirements)
- **phone**: `+1-555-123-4567`
- **credit_card**: `4111111111111111` (Stripe test card)
- **name**: `Test User Alpha`
- **date**: `2024-01-15` (ISO format)
- **number**: `42`
- **url**: `https://example.com/test-page`

Respond with ONLY the test value, no explanation or quotes.
