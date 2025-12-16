import { generateTestSuite } from '../../../src/test-generation/test-generator';
import { CrawlResultsInput } from '../../../src/documentation/models';

describe('Generate Tests Integration', () => {
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

  describe('empty crawl results handling', () => {
    it('should generate empty-results.spec.ts for empty pages array', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: baseSummary,
        pages: [],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.testFiles).toHaveLength(1);
      expect(result.testFiles[0].filename).toBe('empty-results.spec.ts');
      expect(result.testFiles[0].code).toContain('No pages were found in the crawl results');
      expect(result.summary.totalTestFiles).toBe(1);
      expect(result.summary.pagesTested).toBe(0);
    });

    it('should generate placeholder test that always passes', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: baseSummary,
        pages: [],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.testFiles[0].code).toContain('expect(true).toBe(true)');
    });
  });

  describe('basic navigation test generation', () => {
    it('should generate navigation tests for pages without forms', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 2 },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            title: 'Home',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
          {
            url: 'https://example.com/about',
            status: 200,
            title: 'About',
            discoveredAt: '2024-01-01T00:00:01Z',
          },
        ],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should have navigation.spec.ts
      const navigationFile = result.testFiles.find((f) => f.filename === 'navigation.spec.ts');
      expect(navigationFile).toBeDefined();
      expect(navigationFile!.testCases.length).toBeGreaterThanOrEqual(2);

      // Check test case structure
      const homeTestCase = navigationFile!.testCases.find((tc) =>
        tc.name.includes('https://example.com'),
      );
      expect(homeTestCase).toBeDefined();
      expect(homeTestCase!.type).toBe('navigation');
      expect(homeTestCase!.steps).toHaveLength(2); // goto + wait
      expect(homeTestCase!.assertions.length).toBeGreaterThan(0);
    });

    it('should generate URL and title assertions for navigation tests', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1 },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            title: 'Example Home Page',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      const navigationFile = result.testFiles.find((f) => f.filename === 'navigation.spec.ts');
      expect(navigationFile).toBeDefined();

      const testCase = navigationFile!.testCases[0];
      const urlAssertion = testCase.assertions.find((a) => a.type === 'url');
      const titleAssertion = testCase.assertions.find((a) => a.type === 'title');

      expect(urlAssertion).toBeDefined();
      expect(urlAssertion!.expected).toContain('example.com');
      expect(titleAssertion).toBeDefined();
      expect(titleAssertion!.expected).toBe('Example Home Page');
    });

    it('should generate valid Playwright code', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1 },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            title: 'Example',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      const navigationFile = result.testFiles.find((f) => f.filename === 'navigation.spec.ts');
      expect(navigationFile).toBeDefined();
      expect(navigationFile!.code).toContain("import { test, expect } from '@playwright/test'");
      expect(navigationFile!.code).toContain('test.describe');
      expect(navigationFile!.code).toContain('await page.goto');
      expect(navigationFile!.code).toContain('expect(page)');
    });
  });

  describe('test suite structure', () => {
    it('should include generatedAt timestamp', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: baseSummary,
        pages: [],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const beforeTime = new Date().toISOString();
      const result = await generateTestSuite(crawlResults, './tests/generated');
      const afterTime = new Date().toISOString();

      expect(result.generatedAt).toBeDefined();
      expect(result.generatedAt >= beforeTime).toBe(true);
      expect(result.generatedAt <= afterTime).toBe(true);
    });

    it('should set correct output directory', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: baseSummary,
        pages: [],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, '/custom/output/dir');

      expect(result.outputDirectory).toBe('/custom/output/dir');
    });

    it('should include correct summary statistics', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 3 },
        pages: [
          { url: 'https://example.com', status: 200, discoveredAt: '2024-01-01T00:00:00Z' },
          { url: 'https://example.com/about', status: 200, discoveredAt: '2024-01-01T00:00:01Z' },
          { url: 'https://example.com/contact', status: 200, discoveredAt: '2024-01-01T00:00:02Z' },
        ],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.summary.pagesTested).toBe(3);
      expect(result.summary.totalTestCases).toBeGreaterThanOrEqual(3);
      expect(result.summary.aiEnhanced).toBe(false);
    });
  });

  describe('test file organization', () => {
    it('should generate one file per flow plus navigation file', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 3, totalForms: 1 },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            title: 'Home',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/login'],
          },
          {
            url: 'https://example.com/login',
            status: 200,
            title: 'Login',
            discoveredAt: '2024-01-01T00:00:01Z',
            links: ['https://example.com/dashboard'],
          },
          {
            url: 'https://example.com/dashboard',
            status: 200,
            title: 'Dashboard',
            discoveredAt: '2024-01-01T00:00:02Z',
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

      // Should have flow-based file(s) and potentially navigation file
      expect(result.testFiles.length).toBeGreaterThan(0);

      // All files should end with .spec.ts
      result.testFiles.forEach((file) => {
        expect(file.filename).toMatch(/\.spec\.ts$/);
      });
    });

    it('should generate files with proper imports', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1 },
        pages: [
          { url: 'https://example.com', status: 200, discoveredAt: '2024-01-01T00:00:00Z' },
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

  describe('form test generation', () => {
    it('should generate tests for pages with forms', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1, totalForms: 1, totalInputFields: 2 },
        pages: [
          {
            url: 'https://example.com/contact',
            status: 200,
            title: 'Contact',
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
              { type: 'text', name: 'name', pageUrl: 'https://example.com/contact' },
              { type: 'email', name: 'email', pageUrl: 'https://example.com/contact' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Send', pageUrl: 'https://example.com/contact', formId: 'contact-form' },
        ],
        inputFields: [
          { type: 'text', name: 'name', pageUrl: 'https://example.com/contact', formId: 'contact-form' },
          { type: 'email', name: 'email', pageUrl: 'https://example.com/contact', formId: 'contact-form' },
        ],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should have test files
      expect(result.testFiles.length).toBeGreaterThan(0);

      // Should have at least one test file with valid Playwright code
      const hasValidTest = result.testFiles.some(
        (file) => file.code.includes("import { test, expect }") && file.code.includes('test.describe'),
      );
      expect(hasValidTest).toBe(true);
    });
  });

  describe('test data generation', () => {
    it('should generate appropriate test data for form fields', async () => {
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

      // Should have generated email test data
      const hasEmailData = result.testFiles.some((file) =>
        file.code.includes('test.user@example.com') || file.code.includes('@example.com'),
      );
      expect(hasEmailData).toBe(true);

      // Should have generated password test data
      const hasPasswordData = result.testFiles.some((file) =>
        file.code.includes('TestPassword'),
      );
      expect(hasPasswordData).toBe(true);
    });
  });

  describe('summary generation', () => {
    it('should count flows covered', async () => {
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
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.summary.flowsCovered).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalTestFiles).toBeGreaterThan(0);
    });

    it('should set aiEnhanced to false when AI is not used', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: baseSummary,
        pages: [],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.summary.aiEnhanced).toBe(false);
    });
  });
});

