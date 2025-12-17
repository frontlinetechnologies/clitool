/**
 * Playwright code generator for generating TypeScript test code.
 * Generates test code with imports, test.describe, test cases, assertions per research.md structure.
 */

import { TestFile, TestCase, TestStep, Assertion, LocatorType } from './models';

/**
 * Generates Playwright TypeScript test code for a test file.
 *
 * @param testFile - Test file to generate code for
 * @returns Generated TypeScript code string
 */
export function generatePlaywrightCode(testFile: TestFile): string {
  const lines: string[] = [];

  // Add imports
  for (const importStatement of testFile.imports) {
    lines.push(importStatement);
  }
  lines.push('');

  // Generate test.describe block
  const describeName = testFile.flow?.name || 'Tests';
  lines.push(`test.describe('${describeName}', () => {`);

  // Generate test cases
  for (const testCase of testFile.testCases) {
    lines.push(...generateTestCase(testCase, 2)); // Indent with 2 spaces
  }

  lines.push('});');

  return lines.join('\n');
}

/**
 * Generates code for a single test case.
 *
 * @param testCase - Test case to generate code for
 * @param indent - Number of spaces to indent
 * @returns Array of code lines
 */
function generateTestCase(testCase: TestCase, indent: number): string[] {
  const lines: string[] = [];
  const indentStr = ' '.repeat(indent);

  lines.push(`${indentStr}test('${testCase.name}', async ({ page }) => {`);

  // Generate test steps
  for (const step of testCase.steps.sort((a, b) => a.order - b.order)) {
    lines.push(...generateTestStep(step, indent + 2));
  }

  // Generate assertions
  for (const assertion of testCase.assertions) {
    lines.push(...generateAssertion(assertion, indent + 2));
  }

  lines.push(`${indentStr}});`);
  lines.push('');

  return lines;
}

/**
 * Generates code for a single test step.
 *
 * @param step - Test step to generate code for
 * @param indent - Number of spaces to indent
 * @returns Array of code lines
 */
function generateTestStep(step: TestStep, indent: number): string[] {
  const lines: string[] = [];
  const indentStr = ' '.repeat(indent);

  switch (step.action) {
    case 'goto':
      lines.push(`${indentStr}await page.goto('${escapeStringLiteral(step.target)}');`);
      break;

    case 'fill': {
      const fillLocator = generateStepLocator(step);
      const value = step.value ? escapeStringLiteral(step.value) : '';
      lines.push(`${indentStr}await ${fillLocator}.fill('${value}');`);
      break;
    }

    case 'click': {
      const clickLocator = generateStepLocator(step);
      lines.push(`${indentStr}await ${clickLocator}.click();`);
      break;
    }

    case 'wait':
      lines.push(`${indentStr}await page.waitForLoadState('networkidle');`);
      break;

    case 'select': {
      const selectLocator = generateStepLocator(step);
      if (step.value) {
        lines.push(`${indentStr}await ${selectLocator}.selectOption('${escapeStringLiteral(step.value)}');`);
      }
      break;
    }
  }

  return lines;
}

/**
 * Generates a locator string for a test step.
 * Uses structured locator info when available, falls back to legacy locator or target.
 */
function generateStepLocator(step: TestStep): string {
  // Use structured locator type if available
  if (step.locatorType && step.locatorValue) {
    return generateStructuredLocator(step.locatorType, step.locatorValue, step.locatorOptions);
  }

  // Fall back to legacy locator string
  if (step.locator) {
    return step.locator;
  }

  // Fall back to generating from target
  return generateLocator(step.target);
}

/**
 * Generates code for a single assertion.
 *
 * @param assertion - Assertion to generate code for
 * @param indent - Number of spaces to indent
 * @returns Array of code lines
 */
function generateAssertion(assertion: Assertion, indent: number): string[] {
  const lines: string[] = [];
  const indentStr = ' '.repeat(indent);

  // Add description comment if available
  if (assertion.description) {
    lines.push(`${indentStr}// ${assertion.description}`);
  }

  switch (assertion.type) {
    case 'url': {
      // Use string-based RegExp to avoid issues with trailing slashes in regex literals
      const urlPattern = escapeRegexForLiteral(assertion.expected);
      lines.push(`${indentStr}await expect(page).toHaveURL(new RegExp('${urlPattern}'));`);
      break;
    }

    case 'title':
      lines.push(`${indentStr}await expect(page).toHaveTitle(/${escapeRegex(assertion.expected)}/);`);
      break;

    case 'visible': {
      const visibleLocator = generateAssertionLocator(assertion);
      lines.push(`${indentStr}await expect(${visibleLocator}).toBeVisible();`);
      break;
    }

    case 'hidden': {
      const hiddenLocator = generateAssertionLocator(assertion);
      lines.push(`${indentStr}await expect(${hiddenLocator}).toBeHidden();`);
      break;
    }

    case 'enabled': {
      const enabledLocator = generateAssertionLocator(assertion);
      lines.push(`${indentStr}await expect(${enabledLocator}).toBeEnabled();`);
      break;
    }

    case 'disabled': {
      const disabledLocator = generateAssertionLocator(assertion);
      lines.push(`${indentStr}await expect(${disabledLocator}).toBeDisabled();`);
      break;
    }

    case 'value': {
      const valueLocator = generateAssertionLocator(assertion);
      lines.push(`${indentStr}await expect(${valueLocator}).toHaveValue('${escapeStringLiteral(assertion.expected)}');`);
      break;
    }

    case 'text': {
      const textLocator = generateAssertionLocator(assertion);
      lines.push(`${indentStr}await expect(${textLocator}).toContainText('${escapeStringLiteral(assertion.expected)}');`);
      break;
    }
  }

  return lines;
}

/**
 * Generates a locator string for an assertion.
 * Uses structured locator info when available, falls back to legacy locator or target.
 */
function generateAssertionLocator(assertion: Assertion): string {
  // Use structured locator type if available
  if (assertion.locatorType && assertion.locatorValue) {
    return generateStructuredLocator(assertion.locatorType, assertion.locatorValue);
  }

  // Fall back to legacy locator string
  if (assertion.locator) {
    return assertion.locator;
  }

  // Fall back to generating from target
  return generateLocator(assertion.target);
}

/**
 * Generates a Playwright locator string using the structured locator type.
 * Uses Playwright best practices: role > label > placeholder > text > testid > name > css
 *
 * @param locatorType - Type of locator strategy
 * @param locatorValue - Value for the locator
 * @param options - Optional additional options (e.g., { name: 'Submit' } for role)
 * @returns Playwright locator code string
 */
function generateStructuredLocator(
  locatorType: LocatorType,
  locatorValue: string,
  options?: Record<string, string>
): string {
  const escapedValue = escapeStringLiteral(locatorValue);

  switch (locatorType) {
    case 'role': {
      if (options && Object.keys(options).length > 0) {
        const optionsStr = Object.entries(options)
          .map(([k, v]) => `${k}: '${escapeStringLiteral(v)}'`)
          .join(', ');
        return `page.getByRole('${escapedValue}', { ${optionsStr} })`;
      }
      return `page.getByRole('${escapedValue}')`;
    }

    case 'label':
      return `page.getByLabel('${escapedValue}')`;

    case 'placeholder':
      return `page.getByPlaceholder('${escapedValue}')`;

    case 'text':
      return `page.getByText('${escapedValue}')`;

    case 'testid':
      return `page.getByTestId('${escapedValue}')`;

    case 'name':
      return `page.locator('[name="${escapedValue}"]')`;

    case 'css':
      return `page.locator('${escapedValue}')`;

    default:
      // Fallback to getByLabel for unknown types
      return `page.getByLabel('${escapedValue}')`;
  }
}

/**
 * Generates a Playwright locator string for an element (legacy).
 *
 * @param target - Target element identifier (ID, name, placeholder, text, etc.)
 * @returns Playwright locator code string
 */
function generateLocator(target: string): string {
  // Try to determine locator type from target
  if (target.startsWith('#')) {
    return `page.locator('${escapeStringLiteral(target)}')`;
  }

  if (target.startsWith('[') && target.includes('name=')) {
    return `page.locator('${escapeStringLiteral(target)}')`;
  }

  // Default to getByLabel as a safe default for form fields
  return `page.getByLabel('${escapeStringLiteral(target)}')`;
}

/**
 * Escapes single quotes and backslashes for use in string literals.
 *
 * @param str - String to escape
 * @returns Escaped string safe for string literals
 */
function escapeStringLiteral(str: string): string {
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/'/g, "\\'");    // Escape single quotes
}

/**
 * Escapes special regex characters in a string for use in regex literals /.../.
 * Forward slashes are NOT escaped since they don't need escaping in regex literals.
 *
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeRegex(str: string): string {
  // Escape all regex special characters except forward slash
  // Forward slash doesn't need escaping in regex literals /.../
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escapes special regex characters and single quotes for use in RegExp constructor string.
 * This handles trailing slashes correctly by escaping forward slashes.
 *
 * @param str - String to escape
 * @returns Escaped string safe for RegExp constructor
 */
function escapeRegexForLiteral(str: string): string {
  // Escape single quotes for the string literal
  // Escape backslashes first, then forward slashes, then other regex special chars
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/\//g, '\\/')    // Escape forward slashes
    .replace(/'/g, "\\'")     // Escape single quotes
    .replace(/[.*+?^${}()|[\]]/g, '\\$&'); // Escape other regex special chars
}

