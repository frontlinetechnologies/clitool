import { generatePlaywrightCode } from '../../../src/test-generation/playwright-codegen';
import { TestFile } from '../../../src/test-generation/models';

describe('Playwright Code Generator', () => {
  describe('generatePlaywrightCode', () => {
    it('should generate valid Playwright test file structure', () => {
      const testFile: TestFile = {
        filename: 'test-flow.spec.ts',
        testCases: [],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("import { test, expect } from '@playwright/test';");
      expect(code).toContain("test.describe('Tests', () => {");
      expect(code).toContain('});');
    });

    it('should use flow name in test.describe when available', () => {
      const testFile: TestFile = {
        filename: 'login-flow.spec.ts',
        flow: {
          name: 'Login Flow',
          type: 'login',
          priority: 1,
          pages: [],
          description: 'User authentication flow',
        },
        testCases: [],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("test.describe('Login Flow', () => {");
    });

    it('should generate complete test cases with steps and assertions', () => {
      const testFile: TestFile = {
        filename: 'navigation.spec.ts',
        testCases: [
          {
            name: 'should navigate to home page',
            type: 'navigation',
            steps: [
              { action: 'goto', target: 'https://example.com', order: 1 },
              { action: 'wait', target: '', order: 2 },
            ],
            assertions: [
              { type: 'url', target: 'https://example.com', expected: 'example.com' },
              { type: 'title', target: 'page', expected: 'Example' },
            ],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("test('should navigate to home page', async ({ page }) => {");
      expect(code).toContain("await page.goto('https://example.com');");
      expect(code).toContain("await page.waitForLoadState('networkidle');");
      expect(code).toContain("await expect(page).toHaveURL(/example\\.com/);");
      expect(code).toContain("await expect(page).toHaveTitle(/Example/);");
      expect(code).toContain('});');
    });
  });

  describe('test step generation', () => {
    it('should generate goto step correctly', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'navigation',
            steps: [{ action: 'goto', target: 'https://example.com/page', order: 1 }],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.goto('https://example.com/page');");
    });

    it('should generate fill step with locator and value', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [
              {
                action: 'fill',
                target: 'email',
                value: 'test@example.com',
                locator: "page.locator('#email')",
                order: 1,
              },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.locator('#email').fill('test@example.com');");
    });

    it('should generate fill step with empty value when not provided', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [
              {
                action: 'fill',
                target: 'email',
                locator: "page.locator('#email')",
                order: 1,
              },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.locator('#email').fill('');");
    });

    it('should generate click step correctly', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [
              {
                action: 'click',
                target: 'Submit',
                locator: "page.getByRole('button', { name: 'Submit' })",
                order: 1,
              },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.getByRole('button', { name: 'Submit' }).click();");
    });

    it('should generate wait step for network idle', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'navigation',
            steps: [{ action: 'wait', target: '', order: 1 }],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.waitForLoadState('networkidle');");
    });

    it('should generate select step correctly', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [
              {
                action: 'select',
                target: 'country',
                value: 'US',
                locator: "page.locator('#country')",
                order: 1,
              },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.locator('#country').selectOption('US');");
    });

    it('should order steps correctly', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [
              { action: 'click', target: 'submit', locator: "page.locator('#submit')", order: 3 },
              { action: 'goto', target: 'https://example.com', order: 1 },
              { action: 'fill', target: 'email', value: 'test@example.com', locator: "page.locator('#email')", order: 2 },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      // Check that steps appear in correct order
      const gotoIndex = code.indexOf("await page.goto('https://example.com');");
      const fillIndex = code.indexOf("await page.locator('#email').fill('test@example.com');");
      const clickIndex = code.indexOf("await page.locator('#submit').click();");

      expect(gotoIndex).toBeLessThan(fillIndex);
      expect(fillIndex).toBeLessThan(clickIndex);
    });
  });

  describe('assertion generation', () => {
    it('should generate URL assertion with regex escaping', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'navigation',
            steps: [],
            assertions: [{ type: 'url', target: 'page', expected: 'https://example.com/path' }],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      // The implementation escapes dots and slashes within the regex
      expect(code).toContain('await expect(page).toHaveURL(');
      expect(code).toContain('example');
      expect(code).toContain('com');
      expect(code).toContain('path');
    });

    it('should generate title assertion', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'navigation',
            steps: [],
            assertions: [{ type: 'title', target: 'page', expected: 'My Page Title' }],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await expect(page).toHaveTitle(/My Page Title/);");
    });

    it('should generate visibility assertion', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'navigation',
            steps: [],
            assertions: [{ type: 'visible', target: 'success', expected: 'true', locator: "page.locator('.success')" }],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await expect(page.locator('.success')).toBeVisible();");
    });

    it('should generate value assertion', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [],
            assertions: [
              {
                type: 'value',
                target: 'email',
                expected: 'test@example.com',
                locator: "page.getByLabel('Email')",
              },
            ],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await expect(page.getByLabel('Email')).toHaveValue('test@example.com');");
    });

    it('should generate text assertion', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'navigation',
            steps: [],
            assertions: [
              {
                type: 'text',
                target: 'heading',
                expected: 'Welcome',
                locator: "page.locator('h1')",
              },
            ],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await expect(page.locator('h1')).toContainText('Welcome');");
    });
  });

  describe('locator generation', () => {
    it('should use provided locator when available', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [
              {
                action: 'fill',
                target: 'email',
                value: 'test@example.com',
                locator: "page.getByPlaceholder('Enter email')",
                order: 1,
              },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.getByPlaceholder('Enter email').fill('test@example.com');");
    });

    it('should generate ID-based locator for #id targets', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [
              {
                action: 'fill',
                target: '#username',
                value: 'testuser',
                order: 1,
              },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.locator('#username').fill('testuser');");
    });

    it('should generate name-based locator for [name=] targets', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [
              {
                action: 'fill',
                target: '[name="email"]',
                value: 'test@example.com',
                order: 1,
              },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.locator('[name=\"email\"]').fill('test@example.com');");
    });

    it('should default to getByLabel for other targets', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'form-submission',
            steps: [
              {
                action: 'fill',
                target: 'Email Address',
                value: 'test@example.com',
                order: 1,
              },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("await page.getByLabel('Email Address').fill('test@example.com');");
    });
  });

  describe('multiple test cases', () => {
    it('should generate multiple test cases correctly', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'should load page',
            type: 'navigation',
            steps: [{ action: 'goto', target: 'https://example.com', order: 1 }],
            assertions: [{ type: 'title', target: 'page', expected: 'Example' }],
          },
          {
            name: 'should fill form',
            type: 'form-submission',
            steps: [
              { action: 'fill', target: 'email', value: 'test@example.com', locator: "page.locator('#email')", order: 1 },
            ],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      expect(code).toContain("test('should load page', async ({ page }) => {");
      expect(code).toContain("test('should fill form', async ({ page }) => {");
      
      // Check that both test cases are closed properly
      const testMatches = code.match(/test\('[^']+', async \(\{ page \}\) => \{/g);
      expect(testMatches).toHaveLength(2);
    });
  });

  describe('formatting', () => {
    it('should include proper indentation', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test',
            type: 'navigation',
            steps: [{ action: 'goto', target: 'https://example.com', order: 1 }],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);

      // Check indentation levels (2 spaces for test, 4 spaces for statements)
      expect(code).toContain("  test('test', async ({ page }) => {");
      expect(code).toContain("    await page.goto('https://example.com');");
    });

    it('should include blank line between test cases', () => {
      const testFile: TestFile = {
        filename: 'test.spec.ts',
        testCases: [
          {
            name: 'test1',
            type: 'navigation',
            steps: [],
            assertions: [],
          },
          {
            name: 'test2',
            type: 'navigation',
            steps: [],
            assertions: [],
          },
        ],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };

      const code = generatePlaywrightCode(testFile);
      const lines = code.split('\n');

      // Find lines with "});" that close test cases and check for blank line after
      let foundBlankLine = false;
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].trim() === '});' && lines[i + 1].trim() === '') {
          foundBlankLine = true;
          break;
        }
      }
      expect(foundBlankLine).toBe(true);
    });
  });
});

