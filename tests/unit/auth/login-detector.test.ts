import { LoginDetector } from '../../../src/auth/login-detector';
import type { LoginSelectors } from '../../../src/auth/types';

// Mock Playwright Page
const createMockPage = (elements: Record<string, boolean> = {}) => {
  const elementExists = (selector: string) => elements[selector] ?? false;

  return {
    url: jest.fn().mockReturnValue('https://example.com/login'),
    locator: jest.fn((selector: string) => ({
      count: jest.fn().mockResolvedValue(elementExists(selector) ? 1 : 0),
      first: jest.fn().mockReturnValue({
        getAttribute: jest.fn().mockResolvedValue(null),
        isVisible: jest.fn().mockResolvedValue(elementExists(selector)),
      }),
    })),
    $: jest.fn((selector: string) => (elementExists(selector) ? {} : null)),
    $$: jest.fn((selector: string) =>
      elementExists(selector) ? [{}] : [],
    ),
    evaluate: jest.fn().mockResolvedValue(null),
  } as any;
};

describe('LoginDetector', () => {
  let detector: LoginDetector;

  beforeEach(() => {
    detector = new LoginDetector();
  });

  describe('detect', () => {
    it('should detect standard login form with type attributes', async () => {
      const page = createMockPage({
        'input[type="email"]': true,
        'input[type="password"]': true,
        'button[type="submit"]': true,
      });

      const selectors = await detector.detect(page);

      expect(selectors).not.toBeNull();
      expect(selectors?.identifier).toBeDefined();
      expect(selectors?.password).toBeDefined();
    });

    it('should detect login form with id-based selectors', async () => {
      const page = createMockPage({
        '#email': true,
        '#password': true,
        '#login-button': true,
      });

      const selectors = await detector.detect(page);

      expect(selectors).not.toBeNull();
    });

    it('should detect login form with name-based selectors', async () => {
      const page = createMockPage({
        'input[name="email"]': true,
        'input[name="password"]': true,
        'button': true,
      });

      const selectors = await detector.detect(page);

      expect(selectors).not.toBeNull();
    });

    it('should return null when no password field found', async () => {
      const page = createMockPage({
        'input[type="email"]': true,
        // No password field
      });

      const selectors = await detector.detect(page);

      expect(selectors).toBeNull();
    });

    it('should detect login form with username instead of email', async () => {
      const page = createMockPage({
        'input[name="username"]': true,
        'input[type="password"]': true,
        'button[type="submit"]': true,
      });

      const selectors = await detector.detect(page);

      expect(selectors).not.toBeNull();
    });
  });

  describe('validateSelectors', () => {
    it('should validate selectors that exist on page', async () => {
      const page = createMockPage({
        '#my-email': true,
        '#my-password': true,
        '#my-submit': true,
      });

      const selectors: LoginSelectors = {
        identifier: '#my-email',
        password: '#my-password',
        submit: '#my-submit',
      };

      const isValid = await detector.validateSelectors(page, selectors);

      expect(isValid).toBe(true);
    });

    it('should fail validation when identifier selector not found', async () => {
      const page = createMockPage({
        '#my-password': true,
        '#my-submit': true,
        // No identifier
      });

      const selectors: LoginSelectors = {
        identifier: '#my-email',
        password: '#my-password',
        submit: '#my-submit',
      };

      const isValid = await detector.validateSelectors(page, selectors);

      expect(isValid).toBe(false);
    });

    it('should fail validation when password selector not found', async () => {
      const page = createMockPage({
        '#my-email': true,
        '#my-submit': true,
        // No password
      });

      const selectors: LoginSelectors = {
        identifier: '#my-email',
        password: '#my-password',
        submit: '#my-submit',
      };

      const isValid = await detector.validateSelectors(page, selectors);

      expect(isValid).toBe(false);
    });

    it('should pass validation without submit selector if not required', async () => {
      const page = createMockPage({
        '#my-email': true,
        '#my-password': true,
      });

      const selectors: LoginSelectors = {
        identifier: '#my-email',
        password: '#my-password',
        // No submit - optional
      };

      const isValid = await detector.validateSelectors(page, selectors);

      expect(isValid).toBe(true);
    });
  });

  describe('checkSuccess', () => {
    it('should detect success via URL pattern', async () => {
      const page = {
        ...createMockPage(),
        url: jest.fn().mockReturnValue('https://example.com/dashboard'),
      };

      const isSuccess = await detector.checkSuccess(page, {
        url: 'https://example.com/login',
        successIndicators: [{ type: 'url-pattern', pattern: '/dashboard' }],
      });

      expect(isSuccess).toBe(true);
    });

    it('should detect success via element visible', async () => {
      const page = createMockPage({ '.welcome-message': true });

      const isSuccess = await detector.checkSuccess(page, {
        url: 'https://example.com/login',
        successIndicators: [{ type: 'element-visible', selector: '.welcome-message' }],
      });

      expect(isSuccess).toBe(true);
    });

    it('should detect success via element hidden', async () => {
      const page = createMockPage({ '.login-form': false });

      const isSuccess = await detector.checkSuccess(page, {
        url: 'https://example.com/login',
        successIndicators: [{ type: 'element-hidden', selector: '.login-form' }],
      });

      expect(isSuccess).toBe(true);
    });

    it('should return false when success indicator not met', async () => {
      const page = {
        ...createMockPage(),
        url: jest.fn().mockReturnValue('https://example.com/login'),
      };

      const isSuccess = await detector.checkSuccess(page, {
        url: 'https://example.com/login',
        successIndicators: [{ type: 'url-pattern', pattern: '/dashboard' }],
      });

      expect(isSuccess).toBe(false);
    });

    it('should default to URL change from login page when no indicators', async () => {
      const page = {
        ...createMockPage(),
        url: jest.fn().mockReturnValue('https://example.com/home'),
      };

      const isSuccess = await detector.checkSuccess(page, {
        url: 'https://example.com/login',
      });

      expect(isSuccess).toBe(true);
    });
  });
});
