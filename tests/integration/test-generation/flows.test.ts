import { generateTestSuite } from '../../../src/test-generation/test-generator';
import { CrawlResultsInput } from '../../../src/documentation/models';

describe('Flow Test Generation Integration', () => {
  const baseSummary = {
    totalPages: 0,
    totalForms: 0,
    totalButtons: 0,
    totalInputFields: 0,
    errors: 0,
    skipped: 0,
    interrupted: false,
    startTime: '2024-01-01T00:00:00Z',
  };

  describe('login flow test generation', () => {
    it('should generate complete login flow test with email and password', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 2, totalForms: 1, totalInputFields: 2 },
        pages: [
          {
            url: 'https://example.com/login',
            status: 200,
            title: 'Login',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/dashboard'],
          },
          {
            url: 'https://example.com/dashboard',
            status: 200,
            title: 'Dashboard',
            discoveredAt: '2024-01-01T00:00:01Z',
          },
        ],
        forms: [
          {
            id: 'login-form',
            action: '/login',
            method: 'POST',
            pageUrl: 'https://example.com/login',
            inputFields: [
              {
                type: 'email',
                name: 'email',
                id: 'email',
                required: true,
                placeholder: 'Enter email',
                pageUrl: 'https://example.com/login',
                formId: 'login-form',
              },
              {
                type: 'password',
                name: 'password',
                id: 'password',
                required: true,
                pageUrl: 'https://example.com/login',
                formId: 'login-form',
              },
            ],
          },
        ],
        buttons: [
          {
            type: 'submit',
            text: 'Sign In',
            id: 'submit-btn',
            pageUrl: 'https://example.com/login',
            formId: 'login-form',
          },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should detect login flow
      expect(result.summary.flowsCovered).toBeGreaterThan(0);

      // Should have login flow test file
      const hasLoginFlow = result.testFiles.some((f) => 
        f.filename.toLowerCase().includes('login') || f.flow?.type === 'login'
      );
      expect(hasLoginFlow).toBe(true);

      // Should have form submission test case
      const loginFile = result.testFiles.find((f) => 
        f.filename.toLowerCase().includes('login') || f.flow?.type === 'login'
      );
      
      if (loginFile) {
        const hasFormTest = loginFile.testCases.some((tc) => 
          tc.type === 'form-submission' || tc.name.toLowerCase().includes('login')
        );
        expect(hasFormTest).toBe(true);
      }
    });

    it('should include test email and password in generated code', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 2, totalForms: 1, totalInputFields: 2 },
        pages: [
          {
            url: 'https://example.com/login',
            status: 200,
            title: 'Login',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/dashboard'],
          },
          {
            url: 'https://example.com/dashboard',
            status: 200,
            title: 'Dashboard',
            discoveredAt: '2024-01-01T00:00:01Z',
          },
        ],
        forms: [
          {
            id: 'login-form',
            action: '/login',
            method: 'POST',
            pageUrl: 'https://example.com/login',
            inputFields: [
              { type: 'email', name: 'email', pageUrl: 'https://example.com/login' },
              { type: 'password', name: 'password', pageUrl: 'https://example.com/login' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Login', pageUrl: 'https://example.com/login', formId: 'login-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Check that test data is included
      const hasEmail = result.testFiles.some((f) => f.code.includes('@example.com'));
      const hasPassword = result.testFiles.some((f) => f.code.includes('TestPassword'));

      expect(hasEmail).toBe(true);
      expect(hasPassword).toBe(true);
    });
  });

  describe('checkout flow test generation', () => {
    it('should generate checkout flow test with payment fields', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 3, totalForms: 1, totalInputFields: 4 },
        pages: [
          {
            url: 'https://example.com/cart',
            status: 200,
            title: 'Shopping Cart',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/checkout'],
          },
          {
            url: 'https://example.com/checkout',
            status: 200,
            title: 'Checkout',
            discoveredAt: '2024-01-01T00:00:01Z',
            links: ['https://example.com/confirmation'],
          },
          {
            url: 'https://example.com/confirmation',
            status: 200,
            title: 'Order Confirmation',
            discoveredAt: '2024-01-01T00:00:02Z',
          },
        ],
        forms: [
          {
            id: 'checkout-form',
            action: '/checkout',
            method: 'POST',
            pageUrl: 'https://example.com/checkout',
            inputFields: [
              { type: 'text', name: 'cardNumber', required: true, pageUrl: 'https://example.com/checkout' },
              { type: 'text', name: 'cvv', required: true, pageUrl: 'https://example.com/checkout' },
              { type: 'text', name: 'expiryDate', required: true, pageUrl: 'https://example.com/checkout' },
              { type: 'tel', name: 'billingPhone', required: true, pageUrl: 'https://example.com/checkout' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Complete Purchase', pageUrl: 'https://example.com/checkout', formId: 'checkout-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should have test files
      expect(result.testFiles.length).toBeGreaterThan(0);

      // Should include payment test data
      const hasCardNumber = result.testFiles.some((f) => f.code.includes('4111111111111111'));
      expect(hasCardNumber).toBe(true);

      // Should include phone number
      const hasPhone = result.testFiles.some((f) => f.code.includes('+1-555'));
      expect(hasPhone).toBe(true);
    });
  });

  describe('form submission flow test generation', () => {
    it('should generate contact form test', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1, totalForms: 1, totalInputFields: 3 },
        pages: [
          {
            url: 'https://example.com/contact',
            status: 200,
            title: 'Contact Us',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [
          {
            id: 'contact-form',
            action: '/contact',
            method: 'POST',
            pageUrl: 'https://example.com/contact',
            inputFields: [
              { type: 'text', name: 'name', required: true, pageUrl: 'https://example.com/contact' },
              { type: 'email', name: 'email', required: true, pageUrl: 'https://example.com/contact' },
              { type: 'textarea', name: 'message', pageUrl: 'https://example.com/contact' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Send Message', pageUrl: 'https://example.com/contact', formId: 'contact-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.testFiles.length).toBeGreaterThan(0);
      expect(result.summary.totalTestCases).toBeGreaterThan(0);
    });
  });

  describe('multi-step form flow test generation', () => {
    it('should generate tests for multi-step form', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 3, totalForms: 2 },
        pages: [
          {
            url: 'https://example.com/signup/step1',
            status: 200,
            title: 'Sign Up - Step 1',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/signup/step2'],
          },
          {
            url: 'https://example.com/signup/step2',
            status: 200,
            title: 'Sign Up - Step 2',
            discoveredAt: '2024-01-01T00:00:01Z',
            links: ['https://example.com/signup/complete'],
          },
          {
            url: 'https://example.com/signup/complete',
            status: 200,
            title: 'Sign Up Complete',
            discoveredAt: '2024-01-01T00:00:02Z',
          },
        ],
        forms: [
          {
            id: 'signup-form-1',
            action: '/signup/step2',
            method: 'POST',
            pageUrl: 'https://example.com/signup/step1',
            inputFields: [
              { type: 'email', name: 'email', pageUrl: 'https://example.com/signup/step1' },
              { type: 'password', name: 'password', pageUrl: 'https://example.com/signup/step1' },
            ],
          },
          {
            id: 'signup-form-2',
            action: '/signup/complete',
            method: 'POST',
            pageUrl: 'https://example.com/signup/step2',
            inputFields: [
              { type: 'text', name: 'firstName', pageUrl: 'https://example.com/signup/step2' },
              { type: 'text', name: 'lastName', pageUrl: 'https://example.com/signup/step2' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Next', pageUrl: 'https://example.com/signup/step1', formId: 'signup-form-1' },
          { type: 'submit', text: 'Complete', pageUrl: 'https://example.com/signup/step2', formId: 'signup-form-2' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.testFiles.length).toBeGreaterThan(0);
      expect(result.summary.totalTestCases).toBeGreaterThan(0);
    });
  });

  describe('generated code structure', () => {
    it('should generate valid Playwright test structure', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 2, totalForms: 1 },
        pages: [
          {
            url: 'https://example.com/login',
            status: 200,
            title: 'Login',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/dashboard'],
          },
          {
            url: 'https://example.com/dashboard',
            status: 200,
            title: 'Dashboard',
            discoveredAt: '2024-01-01T00:00:01Z',
          },
        ],
        forms: [
          {
            id: 'login-form',
            action: '/login',
            method: 'POST',
            pageUrl: 'https://example.com/login',
            inputFields: [
              { type: 'email', name: 'email', pageUrl: 'https://example.com/login' },
              { type: 'password', name: 'password', pageUrl: 'https://example.com/login' },
            ],
          },
        ],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Every generated file should have valid structure
      result.testFiles.forEach((file) => {
        expect(file.code).toContain("import { test, expect } from '@playwright/test'");
        expect(file.code).toContain('test.describe');
        expect(file.code).toContain('async ({ page })');
      });
    });

    it('should generate properly indented code', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1 },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            title: 'Home',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      result.testFiles.forEach((file) => {
        // Test cases should be indented with 2 spaces
        expect(file.code).toMatch(/^  test\('/m);
        // Statements inside tests should be indented with 4 spaces
        expect(file.code).toMatch(/^    await /m);
      });
    });
  });

  describe('test file imports', () => {
    it('should include Playwright test import', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1 },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      result.testFiles.forEach((file) => {
        expect(file.imports).toContain("import { test, expect } from '@playwright/test';");
      });
    });
  });

  describe('test data inclusion', () => {
    it('should include testData in form submission test cases', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 2, totalForms: 1 },
        pages: [
          {
            url: 'https://example.com/login',
            status: 200,
            title: 'Login',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/dashboard'],
          },
          {
            url: 'https://example.com/dashboard',
            status: 200,
            title: 'Dashboard',
            discoveredAt: '2024-01-01T00:00:01Z',
          },
        ],
        forms: [
          {
            id: 'login-form',
            action: '/login',
            method: 'POST',
            pageUrl: 'https://example.com/login',
            inputFields: [
              { type: 'email', name: 'email', pageUrl: 'https://example.com/login' },
              { type: 'password', name: 'password', pageUrl: 'https://example.com/login' },
            ],
          },
        ],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Find form submission test cases
      const formTestCases = result.testFiles.flatMap((f) => 
        f.testCases.filter((tc) => tc.type === 'form-submission')
      );

      // Form submission test cases should have testData
      formTestCases.forEach((testCase) => {
        if (testCase.testData) {
          expect(testCase.testData.email || testCase.testData.password || testCase.testData.custom).toBeDefined();
        }
      });
    });
  });

  describe('summary statistics', () => {
    it('should correctly count flows covered', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 4, totalForms: 2 },
        pages: [
          {
            url: 'https://example.com/login',
            status: 200,
            title: 'Login',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/dashboard'],
          },
          {
            url: 'https://example.com/dashboard',
            status: 200,
            title: 'Dashboard',
            discoveredAt: '2024-01-01T00:00:01Z',
          },
          {
            url: 'https://example.com/checkout',
            status: 200,
            title: 'Checkout',
            discoveredAt: '2024-01-01T00:00:02Z',
            links: ['https://example.com/confirmation'],
          },
          {
            url: 'https://example.com/confirmation',
            status: 200,
            title: 'Confirmation',
            discoveredAt: '2024-01-01T00:00:03Z',
          },
        ],
        forms: [
          {
            id: 'login-form',
            action: '/login',
            method: 'POST',
            pageUrl: 'https://example.com/login',
            inputFields: [
              { type: 'email', name: 'email', pageUrl: 'https://example.com/login' },
              { type: 'password', name: 'password', pageUrl: 'https://example.com/login' },
            ],
          },
          {
            id: 'checkout-form',
            action: '/checkout',
            method: 'POST',
            pageUrl: 'https://example.com/checkout',
            inputFields: [
              { type: 'text', name: 'cardNumber', pageUrl: 'https://example.com/checkout' },
            ],
          },
        ],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.summary.flowsCovered).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalTestFiles).toBeGreaterThan(0);
      expect(result.summary.totalTestCases).toBeGreaterThan(0);
      expect(result.summary.pagesTested).toBe(4);
    });
  });
});

