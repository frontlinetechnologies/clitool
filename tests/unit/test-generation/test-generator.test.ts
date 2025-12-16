import { generateTestSuite } from '../../../src/test-generation/test-generator';
import { CrawlResultsInput } from '../../../src/documentation/models';

describe('Test Generator - Flow Detection Integration', () => {
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

  describe('login flow detection and test generation', () => {
    it('should detect login flow with email and password fields', async () => {
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
              { type: 'email', name: 'email', required: true, pageUrl: 'https://example.com/login' },
              { type: 'password', name: 'password', required: true, pageUrl: 'https://example.com/login' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Login', pageUrl: 'https://example.com/login', formId: 'login-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.summary.flowsCovered).toBeGreaterThan(0);
      
      // Should have login flow file
      const loginFlowFile = result.testFiles.find((f) => 
        f.filename.includes('login') || f.flow?.type === 'login'
      );
      expect(loginFlowFile).toBeDefined();
    });

    it('should generate fill steps for email and password fields', async () => {
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
              { type: 'email', name: 'email', required: true, pageUrl: 'https://example.com/login' },
              { type: 'password', name: 'password', required: true, pageUrl: 'https://example.com/login' },
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Login', pageUrl: 'https://example.com/login', formId: 'login-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Check that generated code includes fill operations
      const hasEmailFill = result.testFiles.some((f) => 
        f.code.includes('test.user@example.com') || f.code.includes('.fill(')
      );
      expect(hasEmailFill).toBe(true);
    });
  });

  describe('checkout flow detection and test generation', () => {
    it('should detect checkout flow with payment fields', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 2, totalForms: 1, totalInputFields: 3 },
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
            title: 'Order Confirmation',
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
              { type: 'text', name: 'cardNumber', required: true, pageUrl: 'https://example.com/checkout' },
              { type: 'text', name: 'cvv', required: true, pageUrl: 'https://example.com/checkout' },
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

      expect(result.testFiles.length).toBeGreaterThan(0);
      
      // Check for payment-related test data
      const hasPaymentData = result.testFiles.some((f) => 
        f.code.includes('4111111111111111') || f.code.includes('+1-555')
      );
      expect(hasPaymentData).toBe(true);
    });
  });

  describe('form submission flow detection and test generation', () => {
    it('should detect generic form submission flow', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1, totalForms: 1, totalInputFields: 2 },
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
            ],
          },
        ],
        buttons: [
          { type: 'submit', text: 'Send', pageUrl: 'https://example.com/contact', formId: 'contact-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      expect(result.testFiles.length).toBeGreaterThan(0);
      expect(result.summary.totalTestCases).toBeGreaterThan(0);
    });
  });

  describe('navigation flow test generation', () => {
    it('should generate navigation tests for pages in flow', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 3 },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            title: 'Home',
            discoveredAt: '2024-01-01T00:00:00Z',
            links: ['https://example.com/about', 'https://example.com/contact'],
          },
          {
            url: 'https://example.com/about',
            status: 200,
            title: 'About',
            discoveredAt: '2024-01-01T00:00:01Z',
          },
          {
            url: 'https://example.com/contact',
            status: 200,
            title: 'Contact',
            discoveredAt: '2024-01-01T00:00:02Z',
          },
        ],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should have navigation test file
      const navigationFile = result.testFiles.find((f) => f.filename === 'navigation.spec.ts');
      expect(navigationFile).toBeDefined();

      // Should have test cases for each page
      expect(navigationFile!.testCases.length).toBeGreaterThanOrEqual(3);
    });

    it('should include page.goto in navigation tests', async () => {
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

      const navigationFile = result.testFiles.find((f) => f.filename === 'navigation.spec.ts');
      expect(navigationFile).toBeDefined();
      expect(navigationFile!.code).toContain("await page.goto('https://example.com')");
    });
  });

  describe('test case structure for flows', () => {
    it('should generate test cases with correct type', async () => {
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
        file.testCases.forEach((testCase) => {
          expect(['navigation', 'form-submission', 'scenario', 'basic']).toContain(testCase.type);
        });
      });
    });

    it('should generate test cases with steps in correct order', async () => {
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
            ],
          },
        ],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // All test cases should have steps in ascending order
      result.testFiles.forEach((file) => {
        file.testCases.forEach((testCase) => {
          for (let i = 1; i < testCase.steps.length; i++) {
            expect(testCase.steps[i].order).toBeGreaterThanOrEqual(testCase.steps[i - 1].order);
          }
        });
      });
    });
  });

  describe('flow file naming', () => {
    it('should use flow name in filename', async () => {
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

      // All filenames should end with .spec.ts
      result.testFiles.forEach((file) => {
        expect(file.filename).toMatch(/\.spec\.ts$/);
      });

      // Flow files should include flow indicator
      const flowFiles = result.testFiles.filter((f) => f.flow);
      flowFiles.forEach((file) => {
        expect(file.filename).toMatch(/-flow\.spec\.ts$/);
      });
    });
  });

  describe('button locator generation for flows', () => {
    it('should generate button click with button text', async () => {
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
          { type: 'submit', text: 'Sign In', pageUrl: 'https://example.com/login', formId: 'login-form' },
        ],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      // Should have button click with the button text
      const hasButtonClick = result.testFiles.some((f) => 
        f.code.includes("getByRole('button'") && f.code.includes('Sign In')
      );
      expect(hasButtonClick).toBe(true);
    });
  });

  describe('assertion generation for flows', () => {
    it('should generate URL assertion for flow completion', async () => {
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

      // Should have URL assertions
      const hasUrlAssertion = result.testFiles.some((f) => 
        f.code.includes('toHaveURL') || f.code.includes('toHaveTitle')
      );
      expect(hasUrlAssertion).toBe(true);
    });

    it('should generate title assertion when page has title', async () => {
      const crawlResults: CrawlResultsInput = {
        summary: { ...baseSummary, totalPages: 1 },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            title: 'Welcome Page',
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [],
        buttons: [],
        inputFields: [],
      };

      const result = await generateTestSuite(crawlResults, './tests/generated');

      const hasTitleAssertion = result.testFiles.some((f) => 
        f.code.includes('toHaveTitle') && f.code.includes('Welcome')
      );
      expect(hasTitleAssertion).toBe(true);
    });
  });
});

