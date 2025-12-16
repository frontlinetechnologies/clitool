/**
 * Main test generator orchestration.
 * Orchestrates parsing, generation, formatting, and handles empty results per FR-014.
 */

import { CrawlResultsInput } from '../documentation/models';
import { Page } from '../models/page';
import { Form } from '../models/form';
import { InputField } from '../models/input-field';
import {
  GeneratedTestSuite,
  TestFile,
  TestCase,
  TestStep,
  Assertion,
  TestGenerationSummary,
  SpecificScenario,
} from './models';
import { detectCriticalFlows } from '../documentation/flow-detector';
import { generateFlowFilename, generateNavigationFilename, generateEmptyResultsFilename } from './test-file-organizer';
import { generateTestData, generateTestDataForField, generateCouponCode } from './test-data-generator';
import { generatePlaywrightCode } from './playwright-codegen';

/**
 * Generates test suite from crawl results.
 * Handles empty results per FR-014 by generating empty-results.spec.ts with explanation.
 *
 * @param crawlResults - Parsed crawl results input
 * @param outputDirectory - Directory where test files will be saved
 * @returns Generated test suite
 */
export async function generateTestSuite(
  crawlResults: CrawlResultsInput,
  outputDirectory: string,
): Promise<GeneratedTestSuite> {
  // Handle empty results
  if (!crawlResults.pages || crawlResults.pages.length === 0) {
    return generateEmptyTestSuite(outputDirectory);
  }

  const testFiles: TestFile[] = [];

  // Detect critical flows (reuse flow-detector.ts per research.md)
  const flows = detectCriticalFlows(crawlResults.pages, crawlResults.forms || []);

  // Detect specific scenarios per FR-008
  const scenarios = detectSpecificScenarios(
    crawlResults.inputFields || [],
    crawlResults.forms || [],
  );

  // Generate test files for each detected flow
  for (const flow of flows) {
    // Find scenarios that belong to this flow's pages
    const flowPageUrls = new Set(flow.pages.map((p) => p.url));
    const flowScenarios = scenarios.filter((s) => flowPageUrls.has(s.pageUrl));
    
    const testFile = generateFlowTestFile(flow, crawlResults, flowScenarios);
    testFiles.push(testFile);
  }

  // Generate navigation tests for pages without forms per FR-021
  const pagesWithForms = new Set<string>();
  for (const flow of flows) {
    for (const flowPage of flow.pages) {
      pagesWithForms.add(flowPage.url);
    }
  }

  const pagesWithoutForms = crawlResults.pages.filter((page) => !pagesWithForms.has(page.url));

  if (pagesWithoutForms.length > 0) {
    const navigationFile = generateNavigationTestFile(pagesWithoutForms);
    testFiles.push(navigationFile);
  }

  // Generate summary
  const summary: TestGenerationSummary = {
    totalTestFiles: testFiles.length,
    totalTestCases: testFiles.reduce((sum, file) => sum + file.testCases.length, 0),
    flowsCovered: flows.length,
    scenariosDetected: scenarios.length,
    pagesTested: crawlResults.pages.length,
    aiEnhanced: false,
  };

  return {
    outputDirectory,
    testFiles,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates empty test suite with explanation file per FR-014.
 */
function generateEmptyTestSuite(outputDirectory: string): GeneratedTestSuite {
  const filename = generateEmptyResultsFilename();
  const code = `import { test, expect } from '@playwright/test';

test.describe('Empty Results', () => {
  test('no pages found in crawl results', async ({ page }) => {
    // No pages were found in the crawl results.
    // This test file was generated to indicate that the crawl did not discover any pages.
    // Please verify that:
    // 1. The crawl command completed successfully
    // 2. The target URL is accessible
    // 3. The site allows crawling (check robots.txt)
    
    // This is a placeholder test that will always pass
    expect(true).toBe(true);
  });
});
`;

  const testFile: TestFile = {
    filename,
    testCases: [
      {
        name: 'no pages found in crawl results',
        type: 'basic',
        steps: [],
        assertions: [],
      },
    ],
    imports: ["import { test, expect } from '@playwright/test';"],
    code,
  };

  const summary: TestGenerationSummary = {
    totalTestFiles: 1,
    totalTestCases: 1,
    flowsCovered: 0,
    scenariosDetected: 0,
    pagesTested: 0,
    aiEnhanced: false,
  };

  return {
    outputDirectory,
    testFiles: [testFile],
    summary,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates navigation test file for pages without forms per FR-021.
 */
function generateNavigationTestFile(pages: Page[]): TestFile {
  const filename = generateNavigationFilename();
  const testCases: TestCase[] = [];

  for (const page of pages) {
    const steps: TestStep[] = [
      {
        action: 'goto',
        target: page.url,
        order: 1,
      },
      {
        action: 'wait',
        target: '',
        order: 2,
      },
    ];

    const assertions: Assertion[] = [];
    if (page.title) {
      assertions.push({
        type: 'title',
        target: page.url,
        expected: page.title,
      });
    }
    assertions.push({
      type: 'url',
      target: page.url,
      expected: page.url,
    });

    testCases.push({
      name: `should navigate to ${page.url}`,
      type: 'navigation',
      steps,
      assertions,
    });
  }

  const testFile: TestFile = {
    filename,
    testCases,
    imports: ["import { test, expect } from '@playwright/test';"],
    code: '', // Will be generated by playwright-codegen
  };

  // Generate code
  testFile.code = generatePlaywrightCode(testFile);

  return testFile;
}

/**
 * Detects specific scenarios like coupon codes, promo codes, and discount fields per FR-008.
 *
 * @param inputFields - Array of input fields from crawl results
 * @param forms - Array of forms from crawl results
 * @returns Array of detected specific scenarios
 */
export function detectSpecificScenarios(inputFields: InputField[], forms: Form[]): SpecificScenario[] {
  const scenarios: SpecificScenario[] = [];

  // Check input fields
  for (const field of inputFields) {
    const scenario = detectScenarioFromField(field);
    if (scenario) {
      scenarios.push(scenario);
    }
  }

  // Check form input fields
  for (const form of forms) {
    if (form.inputFields) {
      for (const field of form.inputFields) {
        const scenario = detectScenarioFromField(field);
        if (scenario) {
          scenarios.push(scenario);
        }
      }
    }
  }

  return scenarios;
}

/**
 * Detects a specific scenario from an input field.
 */
function detectScenarioFromField(field: InputField): SpecificScenario | null {
  const fieldName = field.name?.toLowerCase() || '';
  const placeholder = field.placeholder?.toLowerCase() || '';

  // Coupon code detection
  if (fieldName.includes('coupon') || placeholder.includes('coupon')) {
    return {
      type: 'coupon-code',
      detectionPattern: fieldName.includes('coupon') ? `name:${fieldName}` : `placeholder:${placeholder}`,
      pageUrl: field.pageUrl,
      inputField: field,
      testData: generateCouponCode(),
    };
  }

  // Promo code detection
  if (fieldName.includes('promo') || placeholder.includes('promo')) {
    return {
      type: 'promo-code',
      detectionPattern: fieldName.includes('promo') ? `name:${fieldName}` : `placeholder:${placeholder}`,
      pageUrl: field.pageUrl,
      inputField: field,
      testData: generateCouponCode(),
    };
  }

  // Discount code detection
  if (fieldName.includes('discount') || placeholder.includes('discount')) {
    return {
      type: 'discount',
      detectionPattern: fieldName.includes('discount') ? `name:${fieldName}` : `placeholder:${placeholder}`,
      pageUrl: field.pageUrl,
      inputField: field,
      testData: generateCouponCode(),
    };
  }

  return null;
}

/**
 * Generates scenario test case for a specific scenario.
 */
function generateScenarioTestCase(scenario: SpecificScenario, crawlResults: CrawlResultsInput): TestCase {
  const steps: TestStep[] = [
    {
      action: 'goto',
      target: scenario.pageUrl,
      order: 1,
    },
    {
      action: 'wait',
      target: '',
      order: 2,
    },
    {
      action: 'fill',
      target: scenario.inputField.name || scenario.inputField.id || 'coupon',
      value: scenario.testData || 'TESTCOUPON',
      locator: generateFieldLocator(scenario.inputField),
      order: 3,
    },
  ];

  // Find submit button for this field's form
  const form = (crawlResults.forms || []).find((f) => f.pageUrl === scenario.pageUrl);
  if (form) {
    const submitButton = (crawlResults.buttons || []).find(
      (b) => b.pageUrl === scenario.pageUrl && (b.formId === form.id || b.type === 'submit'),
    );

    if (submitButton) {
      steps.push({
        action: 'click',
        target: submitButton.text || 'Apply',
        locator: generateButtonLocator(submitButton),
        order: 4,
      });
    }
  }

  const assertions: Assertion[] = [];

  return {
    name: `should apply ${scenario.type.replace('-', ' ')}`,
    type: 'scenario',
    steps,
    assertions,
  };
}

/**
 * Generates test file for a detected user flow.
 * Per FR-006, FR-007, FR-009, FR-010, FR-011: generates navigation, form submission, login, checkout tests.
 * Per FR-008: includes scenario tests for coupon codes, promo codes, etc.
 *
 * @param flow - Detected user flow
 * @param crawlResults - Crawl results input
 * @param scenarios - Specific scenarios detected in this flow
 * @returns Generated test file
 */
function generateFlowTestFile(
  flow: import('../documentation/models').UserFlow,
  crawlResults: CrawlResultsInput,
  scenarios: SpecificScenario[] = [],
): TestFile {
  const filename = generateFlowFilename(flow.name);
  const testCases: TestCase[] = [];

  // Generate navigation tests for flow pages per FR-006
  for (const flowPage of flow.pages) {
    const page = crawlResults.pages.find((p) => p.url === flowPage.url);
    if (page) {
      const navigationTestCase = generateNavigationTestCase(page, flowPage);
      testCases.push(navigationTestCase);
    }
  }

  // Generate form submission tests per FR-007
  if (flow.type === 'login') {
    const loginTestCase = generateLoginFlowTestCase(flow, crawlResults);
    if (loginTestCase) {
      testCases.push(loginTestCase);
    }
  } else if (flow.type === 'checkout') {
    const checkoutTestCase = generateCheckoutFlowTestCase(flow, crawlResults);
    if (checkoutTestCase) {
      testCases.push(checkoutTestCase);
    }
  } else if (flow.type === 'form-submission') {
    const formTestCase = generateFormSubmissionTestCase(flow, crawlResults);
    if (formTestCase) {
      testCases.push(formTestCase);
    }
  }

  // Generate scenario tests per FR-008
  for (const scenario of scenarios) {
    const scenarioTestCase = generateScenarioTestCase(scenario, crawlResults);
    testCases.push(scenarioTestCase);
  }

  const testFile: TestFile = {
    filename,
    flow,
    testCases,
    imports: ["import { test, expect } from '@playwright/test';"],
    code: '',
  };

  // Generate code
  testFile.code = generatePlaywrightCode(testFile);

  return testFile;
}

/**
 * Generates navigation test case for a flow page.
 */
function generateNavigationTestCase(
  page: Page,
  flowPage: import('../documentation/models').FlowPage,
): TestCase {
  const steps: TestStep[] = [
    {
      action: 'goto',
      target: page.url,
      order: 1,
    },
    {
      action: 'wait',
      target: '',
      order: 2,
    },
  ];

  const assertions: Assertion[] = [];
  if (page.title) {
    assertions.push({
      type: 'title',
      target: page.url,
      expected: page.title,
    });
  }
  assertions.push({
    type: 'url',
    target: page.url,
    expected: page.url,
  });

  return {
    name: `should navigate to ${flowPage.description || page.url}`,
    type: 'navigation',
    steps,
    assertions,
  };
}

/**
 * Generates login flow test case per FR-009.
 */
function generateLoginFlowTestCase(
  flow: import('../documentation/models').UserFlow,
  crawlResults: CrawlResultsInput,
): TestCase | null {
  const entryPage = flow.pages.find((p) => p.role === 'entry');
  if (!entryPage) {
    return null;
  }

  const page = crawlResults.pages.find((p) => p.url === entryPage.url);
  if (!page) {
    return null;
  }

  const forms = (crawlResults.forms || []).filter((f) => f.pageUrl === page.url);
  if (forms.length === 0) {
    return null;
  }

  const form = forms[0];
  const inputFields = form.inputFields || [];

  const steps: TestStep[] = [
    {
      action: 'goto',
      target: page.url,
      order: 1,
    },
    {
      action: 'wait',
      target: '',
      order: 2,
    },
  ];

  // Fill form fields
  let stepOrder = 3;
  for (const field of inputFields) {
    const testData = generateTestDataForField(field);
    const locator = generateFieldLocator(field);

    steps.push({
      action: 'fill',
      target: field.name || field.id || '',
      value: testData,
      locator,
      order: stepOrder++,
    });
  }

  // Click submit button
  const submitButton = (crawlResults.buttons || []).find(
    (b) => b.pageUrl === page.url && (b.formId === form.id || b.type === 'submit'),
  );

  if (submitButton) {
    const buttonLocator = generateButtonLocator(submitButton);
    steps.push({
      action: 'click',
      target: submitButton.text || submitButton.id || 'submit',
      locator: buttonLocator,
      order: stepOrder++,
    });
  }

  // Generate assertions
  const assertions: Assertion[] = [];
  const confirmationPage = flow.pages.find((p) => p.role === 'confirmation');
  if (confirmationPage) {
    assertions.push({
      type: 'url',
      target: confirmationPage.url,
      expected: confirmationPage.url,
    });
  }

  const testData = generateTestData(inputFields);

  return {
    name: 'should fill login form and submit',
    type: 'form-submission',
    steps,
    assertions,
    testData,
  };
}

/**
 * Generates checkout flow test case per FR-010.
 */
function generateCheckoutFlowTestCase(
  flow: import('../documentation/models').UserFlow,
  crawlResults: CrawlResultsInput,
): TestCase | null {
  const formPage = flow.pages.find((p) => p.role === 'form');
  if (!formPage) {
    return null;
  }

  const page = crawlResults.pages.find((p) => p.url === formPage.url);
  if (!page) {
    return null;
  }

  const forms = (crawlResults.forms || []).filter((f) => f.pageUrl === page.url);
  if (forms.length === 0) {
    return null;
  }

  const form = forms[0];
  const inputFields = form.inputFields || [];

  const steps: TestStep[] = [
    {
      action: 'goto',
      target: page.url,
      order: 1,
    },
    {
      action: 'wait',
      target: '',
      order: 2,
    },
  ];

  // Fill form fields
  let stepOrder = 3;
  for (const field of inputFields) {
    const testData = generateTestDataForField(field);
    const locator = generateFieldLocator(field);

    steps.push({
      action: 'fill',
      target: field.name || field.id || '',
      value: testData,
      locator,
      order: stepOrder++,
    });
  }

  // Click submit button
  const submitButton = (crawlResults.buttons || []).find(
    (b) => b.pageUrl === page.url && (b.formId === form.id || b.type === 'submit'),
  );

  if (submitButton) {
    const buttonLocator = generateButtonLocator(submitButton);
    steps.push({
      action: 'click',
      target: submitButton.text || submitButton.id || 'submit',
      locator: buttonLocator,
      order: stepOrder++,
    });
  }

  // Generate assertions
  const assertions: Assertion[] = [];
  const confirmationPage = flow.pages.find((p) => p.role === 'confirmation');
  if (confirmationPage) {
    assertions.push({
      type: 'url',
      target: confirmationPage.url,
      expected: confirmationPage.url,
    });
  }

  const testData = generateTestData(inputFields);

  return {
    name: 'should fill checkout form and submit',
    type: 'form-submission',
    steps,
    assertions,
    testData,
  };
}

/**
 * Generates form submission test case for multi-step forms per FR-011.
 */
function generateFormSubmissionTestCase(
  flow: import('../documentation/models').UserFlow,
  crawlResults: CrawlResultsInput,
): TestCase | null {
  if (flow.pages.length < 2) {
    return null;
  }

  const steps: TestStep[] = [];
  let stepOrder = 1;

  // Navigate through all flow pages
  for (const flowPage of flow.pages) {
    const page = crawlResults.pages.find((p) => p.url === flowPage.url);
    if (!page) {
      continue;
    }

    steps.push({
      action: 'goto',
      target: page.url,
      order: stepOrder++,
    });

    steps.push({
      action: 'wait',
      target: '',
      order: stepOrder++,
    });

    // Fill forms on this page
    const forms = (crawlResults.forms || []).filter((f) => f.pageUrl === page.url);
    for (const form of forms) {
      const inputFields = form.inputFields || [];
      for (const field of inputFields) {
        const testData = generateTestDataForField(field);
        const locator = generateFieldLocator(field);

        steps.push({
          action: 'fill',
          target: field.name || field.id || '',
          value: testData,
          locator,
          order: stepOrder++,
        });
      }

      // Click submit button
      const submitButton = (crawlResults.buttons || []).find(
        (b) => b.pageUrl === page.url && (b.formId === form.id || b.type === 'submit'),
      );

      if (submitButton) {
        const buttonLocator = generateButtonLocator(submitButton);
        steps.push({
          action: 'click',
          target: submitButton.text || submitButton.id || 'submit',
          locator: buttonLocator,
          order: stepOrder++,
        });
      }
    }
  }

  // Generate assertions
  const assertions: Assertion[] = [];
  const lastPage = flow.pages[flow.pages.length - 1];
  if (lastPage) {
    assertions.push({
      type: 'url',
      target: lastPage.url,
      expected: lastPage.url,
    });
  }

  return {
    name: `should complete ${flow.name.toLowerCase()}`,
    type: 'form-submission',
    steps,
    assertions,
  };
}

/**
 * Generates Playwright locator for an input field.
 */
function generateFieldLocator(field: InputField): string {
  if (field.id) {
    return `page.locator('#${field.id}')`;
  }
  if (field.name) {
    return `page.locator('[name="${field.name}"]')`;
  }
  if (field.placeholder) {
    return `page.getByPlaceholder('${field.placeholder}')`;
  }
  return `page.getByLabel('${field.type}')`;
}

/**
 * Generates Playwright locator for a button.
 */
function generateButtonLocator(button: import('../models/button').Button): string {
  if (button.text) {
    return `page.getByRole('button', { name: '${button.text}' })`;
  }
  if (button.id) {
    return `page.locator('#${button.id}')`;
  }
  return `page.getByRole('button')`;
}

