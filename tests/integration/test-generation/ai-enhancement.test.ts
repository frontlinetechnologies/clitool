import { generateTestSuite } from '../../../src/test-generation/test-generator';
import { CrawlResultsInput } from '../../../src/documentation/models';
import { resetClient } from '../../../src/ai/anthropic-client';

describe('AI-Enhanced Test Generation Integration', () => {
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

  beforeEach(() => {
    resetClient();
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    resetClient();
  });

  describe('fallback to pattern-based generation', () => {
    it('should generate tests without AI when API key is not set', async () => {
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
        buttons: [
          { type: 'submit', text: 'Login', pageUrl: 'https://example.com/login', formId: 'login-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should generate tests using pattern-based approach
      expect(result.testFiles.length).toBeGreaterThan(0);
      expect(result.summary.aiEnhanced).toBe(false);
    });

    it('should use pattern-based test data when AI is unavailable', async () => {
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
        buttons: [
          { type: 'submit', text: 'Login', pageUrl: 'https://example.com/login', formId: 'login-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should generate tests and use pattern-based test data
      expect(result.testFiles.length).toBeGreaterThan(0);
      
      // The summary should indicate no AI was used
      expect(result.summary.aiEnhanced).toBe(false);
    });
  });

  describe('aiEnhanced flag', () => {
    it('should set aiEnhanced to false when API is unavailable', async () => {
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

      expect(result.summary.aiEnhanced).toBe(false);
    });
  });

  describe('test quality without AI', () => {
    it('should generate comprehensive tests even without AI', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 3, totalForms: 2 },
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
              { type: 'text', name: 'cvv', pageUrl: 'https://example.com/checkout' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Login', pageUrl: 'https://example.com/login', formId: 'login-form' },
          { type: 'submit', text: 'Pay', pageUrl: 'https://example.com/checkout', formId: 'checkout-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should have multiple test files
      expect(result.testFiles.length).toBeGreaterThan(0);

      // Should have multiple test cases
      expect(result.summary.totalTestCases).toBeGreaterThan(0);

      // Should detect flows
      expect(result.summary.flowsCovered).toBeGreaterThan(0);

      // All test files should have valid Playwright code
      result.testFiles.forEach((file) => {
        expect(file.code).toContain("import { test, expect } from '@playwright/test'");
        expect(file.code).toContain('test.describe');
      });
    });
  });

  describe('error resilience', () => {
    it('should not fail if AI enhancement throws', async () => {
      // Set invalid API key to simulate API error
      process.env.ANTHROPIC_API_KEY = 'invalid-key';

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

      // Should not throw, should fallback gracefully
      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.testFiles.length).toBeGreaterThan(0);
    });
  });
});

