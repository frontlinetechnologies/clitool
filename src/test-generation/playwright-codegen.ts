/**
 * Playwright code generator for generating TypeScript test code.
 * Generates test code with imports, test.describe, test cases, assertions per research.md structure.
 */

import { TestFile, TestCase, TestStep, Assertion } from './models';

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
      lines.push(`${indentStr}await page.goto('${step.target}');`);
      break;

    case 'fill':
      const fillLocator = step.locator || generateLocator(step.target);
      if (step.value) {
        lines.push(`${indentStr}await ${fillLocator}.fill('${step.value}');`);
      } else {
        lines.push(`${indentStr}await ${fillLocator}.fill('');`);
      }
      break;

    case 'click':
      const clickLocator = step.locator || generateLocator(step.target);
      lines.push(`${indentStr}await ${clickLocator}.click();`);
      break;

    case 'wait':
      lines.push(`${indentStr}await page.waitForLoadState('networkidle');`);
      break;

    case 'select':
      const selectLocator = step.locator || generateLocator(step.target);
      if (step.value) {
        lines.push(`${indentStr}await ${selectLocator}.selectOption('${step.value}');`);
      }
      break;
  }

  return lines;
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

  switch (assertion.type) {
    case 'url':
      // Use string-based RegExp to avoid issues with trailing slashes in regex literals
      const urlPattern = escapeRegexForLiteral(assertion.expected);
      lines.push(`${indentStr}await expect(page).toHaveURL(new RegExp('${urlPattern}'));`);
      break;

    case 'title':
      lines.push(`${indentStr}await expect(page).toHaveTitle(/${escapeRegex(assertion.expected)}/);`);
      break;

    case 'visible':
      const visibleLocator = assertion.locator || generateLocator(assertion.target);
      lines.push(`${indentStr}await expect(${visibleLocator}).toBeVisible();`);
      break;

    case 'value':
      const valueLocator = assertion.locator || generateLocator(assertion.target);
      lines.push(`${indentStr}await expect(${valueLocator}).toHaveValue('${assertion.expected}');`);
      break;

    case 'text':
      const textLocator = assertion.locator || generateLocator(assertion.target);
      lines.push(`${indentStr}await expect(${textLocator}).toContainText('${assertion.expected}');`);
      break;
  }

  return lines;
}

/**
 * Generates a Playwright locator string for an element.
 *
 * @param target - Target element identifier (ID, name, placeholder, text, etc.)
 * @returns Playwright locator code string
 */
function generateLocator(target: string): string {
  // Try to determine locator type from target
  if (target.startsWith('#')) {
    return `page.locator('${target}')`;
  }

  if (target.startsWith('[') && target.includes('name=')) {
    return `page.locator('${target}')`;
  }

  // Default to getByRole or getByLabel based on context
  // For now, use getByLabel as a safe default
  return `page.getByLabel('${target}')`;
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

