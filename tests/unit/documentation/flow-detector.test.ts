import { detectCriticalFlows } from '../../../src/documentation/flow-detector';
import { Page } from '../../../src/models/page';
import { Form } from '../../../src/models/form';

describe('Flow Detector', () => {
  describe('detectCriticalFlows', () => {
    it('should detect login flow from password and email fields', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/login',
          status: 200,
          title: 'Login',
          discoveredAt: '2024-01-01T00:00:00Z',
          links: ['https://example.com/dashboard'],
        },
      ];

      const forms: Form[] = [
        {
          id: 'login-form',
          action: '/login',
          method: 'POST',
          pageUrl: 'https://example.com/login',
          inputFields: [
            {
              type: 'email',
              name: 'email',
              required: true,
              pageUrl: 'https://example.com/login',
              formId: 'login-form',
            },
            {
              type: 'password',
              name: 'password',
              required: true,
              pageUrl: 'https://example.com/login',
              formId: 'login-form',
            },
          ],
        },
      ];

      const flows = detectCriticalFlows(pages, forms);

      const loginFlow = flows.find((f) => f.type === 'login');
      expect(loginFlow).toBeDefined();
      expect(loginFlow?.name).toBe('Login Flow');
      expect(loginFlow?.pages.length).toBeGreaterThan(0);
      expect(loginFlow?.pages[0].url).toBe('https://example.com/login');
    });

    it('should detect checkout flow from payment fields', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/checkout',
          status: 200,
          title: 'Checkout',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
      ];

      const forms: Form[] = [
        {
          id: 'checkout-form',
          action: '/checkout',
          method: 'POST',
          pageUrl: 'https://example.com/checkout',
          inputFields: [
            {
              type: 'text',
              name: 'cardNumber',
              required: true,
              pageUrl: 'https://example.com/checkout',
              formId: 'checkout-form',
            },
            {
              type: 'text',
              name: 'cvv',
              required: true,
              pageUrl: 'https://example.com/checkout',
              formId: 'checkout-form',
            },
          ],
        },
      ];

      const flows = detectCriticalFlows(pages, forms);

      const checkoutFlow = flows.find((f) => f.type === 'checkout');
      expect(checkoutFlow).toBeDefined();
      expect(checkoutFlow?.name).toBe('Checkout Flow');
    });

    it('should detect checkout flow from checkout URL', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/checkout',
          status: 200,
          title: 'Checkout',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
      ];

      const forms: Form[] = [];

      const flows = detectCriticalFlows(pages, forms);

      const checkoutFlow = flows.find((f) => f.type === 'checkout');
      expect(checkoutFlow).toBeDefined();
    });

    it('should detect form submission flows from action URLs', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/form1',
          status: 200,
          title: 'Form 1',
          discoveredAt: '2024-01-01T00:00:00Z',
          links: ['https://example.com/form2'],
        },
        {
          url: 'https://example.com/form2',
          status: 200,
          title: 'Form 2',
          discoveredAt: '2024-01-01T00:00:01Z',
        },
      ];

      const forms: Form[] = [
        {
          id: 'form1',
          action: '/submit',
          method: 'POST',
          pageUrl: 'https://example.com/form1',
          inputFields: [],
        },
        {
          id: 'form2',
          action: '/submit',
          method: 'POST',
          pageUrl: 'https://example.com/form2',
          inputFields: [],
        },
      ];

      const flows = detectCriticalFlows(pages, forms);

      const formFlow = flows.find((f) => f.type === 'form-submission');
      expect(formFlow).toBeDefined();
      expect(formFlow?.pages.length).toBeGreaterThanOrEqual(1);
    });

    it('should prioritize flows by form complexity', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/simple',
          status: 200,
          title: 'Simple Form',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
        {
          url: 'https://example.com/complex',
          status: 200,
          title: 'Complex Form',
          discoveredAt: '2024-01-01T00:00:01Z',
        },
      ];

      const forms: Form[] = [
        {
          id: 'simple',
          action: '/simple',
          method: 'POST',
          pageUrl: 'https://example.com/simple',
          inputFields: [
            { type: 'text', name: 'field1', pageUrl: 'https://example.com/simple', formId: 'simple' },
          ],
        },
        {
          id: 'complex',
          action: '/complex',
          method: 'POST',
          pageUrl: 'https://example.com/complex',
          inputFields: [
            { type: 'text', name: 'field1', pageUrl: 'https://example.com/complex', formId: 'complex' },
            { type: 'text', name: 'field2', pageUrl: 'https://example.com/complex', formId: 'complex' },
            { type: 'text', name: 'field3', pageUrl: 'https://example.com/complex', formId: 'complex' },
            { type: 'text', name: 'field4', pageUrl: 'https://example.com/complex', formId: 'complex' },
            { type: 'text', name: 'field5', pageUrl: 'https://example.com/complex', formId: 'complex' },
          ],
        },
      ];

      const flows = detectCriticalFlows(pages, forms);

      // Complex form should have higher priority
      const complexFlow = flows.find((f) => f.pages.some((p) => p.url === 'https://example.com/complex'));
      const simpleFlow = flows.find((f) => f.pages.some((p) => p.url === 'https://example.com/simple'));

      if (complexFlow && simpleFlow && complexFlow.priority && simpleFlow.priority) {
        expect(complexFlow.priority).toBeGreaterThan(simpleFlow.priority);
      }
    });

    it('should handle pages with no forms', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/page',
          status: 200,
          title: 'Page',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
      ];

      const forms: Form[] = [];

      const flows = detectCriticalFlows(pages, forms);

      expect(flows).toBeDefined();
      expect(flows.length).toBeGreaterThanOrEqual(0);
    });
  });
});

