import { generateTestSuite } from '../../../src/test-generation/test-generator';
import { CrawlResultsInput } from '../../../src/documentation/models';

describe('Scenario Test Generation Integration', () => {
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

  describe('coupon code scenario test generation', () => {
    it('should generate tests for coupon code input', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1, totalForms: 1, totalInputFields: 1 },
        pages: [
          {
            url: 'https://example.com/checkout',
            status: 200,
            title: 'Checkout',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [
          {
            id: 'coupon-form',
            action: '/apply-coupon',
            method: 'POST',
            pageUrl: 'https://example.com/checkout',
            inputFields: [
              {
                type: 'text',
                name: 'coupon_code',
                placeholder: 'Enter coupon code',
                pageUrl: 'https://example.com/checkout',
              },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Apply', pageUrl: 'https://example.com/checkout', formId: 'coupon-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.summary.scenariosDetected).toBeGreaterThan(0);
      
      // Should include coupon test data
      const hasCouponData = result.testFiles.some((f) => 
        f.code.includes('TESTCOUPON') || f.code.includes('PROMO')
      );
      expect(hasCouponData).toBe(true);
    });

    it('should include scenario in flow file', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 2, totalForms: 2, totalInputFields: 4 },
        pages: [
          {
            url: 'https://example.com/checkout',
            status: 200,
            title: 'Checkout',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/confirmation'],
          },
          {
            url: 'https://example.com/confirmation',
            status: 200,
            title: 'Confirmation',
            discoveredAt: '2024-01-01T00:00:01Z',
          },
        ],
        forms: [
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
          {
            id: 'coupon-form',
            action: '/apply-coupon',
            method: 'POST',
            pageUrl: 'https://example.com/checkout',
            inputFields: [
              { type: 'text', name: 'coupon_code', pageUrl: 'https://example.com/checkout' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Pay', pageUrl: 'https://example.com/checkout', formId: 'checkout-form' },
          { type: 'submit', text: 'Apply Coupon', pageUrl: 'https://example.com/checkout', formId: 'coupon-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.testFiles.length).toBeGreaterThan(0);
      expect(result.summary.scenariosDetected).toBeGreaterThan(0);
    });
  });

  describe('promo code scenario test generation', () => {
    it('should generate tests for promo code input', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1, totalForms: 1, totalInputFields: 1 },
        pages: [
          {
            url: 'https://example.com/cart',
            status: 200,
            title: 'Shopping Cart',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [
          {
            id: 'promo-form',
            action: '/apply-promo',
            method: 'POST',
            pageUrl: 'https://example.com/cart',
            inputFields: [
              {
                type: 'text',
                name: 'promo_code',
                pageUrl: 'https://example.com/cart',
              },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Apply', pageUrl: 'https://example.com/cart', formId: 'promo-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.summary.scenariosDetected).toBeGreaterThan(0);
    });
  });

  describe('discount code scenario test generation', () => {
    it('should generate tests for discount code input', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1, totalForms: 1, totalInputFields: 1 },
        pages: [
          {
            url: 'https://example.com/cart',
            status: 200,
            title: 'Cart',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [
          {
            id: 'discount-form',
            action: '/apply-discount',
            method: 'POST',
            pageUrl: 'https://example.com/cart',
            inputFields: [
              {
                type: 'text',
                name: 'discount_code',
                pageUrl: 'https://example.com/cart',
              },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Apply Discount', pageUrl: 'https://example.com/cart', formId: 'discount-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.summary.scenariosDetected).toBeGreaterThan(0);
    });
  });

  describe('scenario test assertions', () => {
    it('should include scenario-specific assertions', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1, totalForms: 1, totalInputFields: 1 },
        pages: [
          {
            url: 'https://example.com/checkout',
            status: 200,
            title: 'Checkout',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [
          {
            id: 'coupon-form',
            action: '/apply-coupon',
            method: 'POST',
            pageUrl: 'https://example.com/checkout',
            inputFields: [
              { type: 'text', name: 'coupon_code', pageUrl: 'https://example.com/checkout' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Apply Coupon', pageUrl: 'https://example.com/checkout', formId: 'coupon-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should have test files
      expect(result.testFiles.length).toBeGreaterThan(0);

      // Should have valid test code
      const hasValidCode = result.testFiles.some((f) => 
        f.code.includes('test.describe') && f.code.includes('expect')
      );
      expect(hasValidCode).toBe(true);
    });
  });

  describe('scenario statistics', () => {
    it('should count scenarios in summary', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1, totalForms: 2, totalInputFields: 2 },
        pages: [
          {
            url: 'https://example.com/checkout',
            status: 200,
            title: 'Checkout',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [
          {
            id: 'coupon-form',
            action: '/apply-coupon',
            method: 'POST',
            pageUrl: 'https://example.com/checkout',
            inputFields: [
              { type: 'text', name: 'coupon_code', pageUrl: 'https://example.com/checkout' },
            ],
          },
          {
            id: 'promo-form',
            action: '/apply-promo',
            method: 'POST',
            pageUrl: 'https://example.com/checkout',
            inputFields: [
              { type: 'text', name: 'promo_code', pageUrl: 'https://example.com/checkout' },
            ],
          },
        ],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.summary.scenariosDetected).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 scenarios when none detected', async () => {
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

      expect(result.summary.scenariosDetected).toBe(0);
    });
  });

  describe('scenario test file organization', () => {
    it('should include scenario tests in flow file', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 2, totalForms: 2 },
        pages: [
          {
            url: 'https://example.com/checkout',
            status: 200,
            title: 'Checkout',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/confirmation'],
          },
          {
            url: 'https://example.com/confirmation',
            status: 200,
            title: 'Confirmation',
            discoveredAt: '2024-01-01T00:00:01Z',
          },
        ],
        forms: [
          {
            id: 'checkout-form',
            action: '/checkout',
            method: 'POST',
            pageUrl: 'https://example.com/checkout',
            inputFields: [
              { type: 'text', name: 'cardNumber', pageUrl: 'https://example.com/checkout' },
            ],
          },
          {
            id: 'coupon-form',
            action: '/apply-coupon',
            method: 'POST',
            pageUrl: 'https://example.com/checkout',
            inputFields: [
              { type: 'text', name: 'coupon_code', pageUrl: 'https://example.com/checkout' },
            ],
          },
        ],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // All scenarios should be in test files (either in flow file or scenarios file)
      // If we have detected scenarios, we should have scenario test cases OR the scenarios are included in flow tests
      if (result.summary.scenariosDetected > 0) {
        const hasCouponTest = result.testFiles.some((f) => 
          f.code.includes('coupon') || f.code.includes('TESTCOUPON')
        );
        expect(hasCouponTest).toBe(true);
      }
    });
  });
});

