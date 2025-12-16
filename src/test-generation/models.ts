/**
 * Models for test generation representing generated test suites, test files, and test cases.
 * These models define the data structures used throughout the test generation process.
 */

import { UserFlow } from '../documentation/models';
import { InputField } from '../models/input-field';

/**
 * Represents the collection of generated Playwright test files organized by user flows.
 */
export interface GeneratedTestSuite {
  outputDirectory: string;
  testFiles: TestFile[];
  summary: TestGenerationSummary;
  generatedAt: string; // ISO 8601 timestamp
}

/**
 * Represents a single generated Playwright test file (one file per user flow).
 */
export interface TestFile {
  filename: string; // e.g., "login-flow.spec.ts"
  flow?: UserFlow; // Associated user flow (if file is flow-based)
  testCases: TestCase[];
  imports: string[]; // Required Playwright imports
  code: string; // Generated TypeScript test code
}

/**
 * Represents an individual test scenario within a test file.
 */
export interface TestCase {
  name: string; // Test case name/description
  type: 'navigation' | 'form-submission' | 'scenario' | 'basic';
  steps: TestStep[];
  assertions: Assertion[];
  testData?: TestData; // Test data used in this test case
}

/**
 * Represents a single action step in a test case (e.g., navigate, fill form, click button).
 */
export interface TestStep {
  action: 'goto' | 'fill' | 'click' | 'wait' | 'select';
  target: string; // Target element or URL
  value?: string; // Value for actions like "fill" or "select"
  locator?: string; // Playwright locator string
  order: number; // Step order in sequence
}

/**
 * Represents a verification assertion in a test case.
 */
export interface Assertion {
  type: 'url' | 'title' | 'visible' | 'value' | 'text';
  target: string; // Target element or page
  expected: string; // Expected value
  locator?: string; // Playwright locator for element assertions
}

/**
 * Represents test data used in test cases (input values, test strings).
 */
export interface TestData {
  email?: string;
  password?: string;
  text?: string;
  phone?: string;
  creditCard?: string;
  couponCode?: string;
  date?: string;
  custom?: Record<string, string>; // Custom field values
}

/**
 * Represents summary statistics for test generation.
 */
export interface TestGenerationSummary {
  totalTestFiles: number;
  totalTestCases: number;
  flowsCovered: number;
  scenariosDetected: number;
  pagesTested: number;
  aiEnhanced: boolean;
}

/**
 * Represents a specific test scenario detected in crawl results (e.g., coupon code entry).
 */
export interface SpecificScenario {
  type: 'coupon-code' | 'promo-code' | 'discount' | 'custom';
  detectionPattern: string; // Pattern that detected this scenario (field name, placeholder, etc.)
  pageUrl: string; // URL of page where scenario was detected
  inputField: InputField; // Input field associated with scenario
  testData?: string; // Generated test data for this scenario
}

