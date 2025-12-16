import {
  organizeTestFilesByFlow,
  generateFlowFilename,
  generateNavigationFilename,
  generateEmptyResultsFilename,
} from '../../../src/test-generation/test-file-organizer';
import { UserFlow } from '../../../src/documentation/models';
import { TestFile } from '../../../src/test-generation/models';

describe('Test File Organizer', () => {
  describe('generateFlowFilename', () => {
    it('should convert flow name to kebab-case', () => {
      const filename = generateFlowFilename('Login Flow');

      expect(filename).toBe('login-flow.spec.ts');
    });

    it('should handle multiple words', () => {
      const filename = generateFlowFilename('User Registration Flow');

      expect(filename).toBe('user-registration-flow.spec.ts');
    });

    it('should handle special characters', () => {
      const filename = generateFlowFilename('Login & Registration');

      expect(filename).toBe('login-registration-flow.spec.ts');
    });

    it('should not duplicate -flow suffix', () => {
      const filename = generateFlowFilename('checkout-flow');

      expect(filename).toBe('checkout-flow.spec.ts');
    });

    it('should handle uppercase flow names', () => {
      const filename = generateFlowFilename('CHECKOUT');

      expect(filename).toBe('checkout-flow.spec.ts');
    });

    it('should handle numbers in flow names', () => {
      const filename = generateFlowFilename('Step 1 Form');

      expect(filename).toBe('step-1-form-flow.spec.ts');
    });

    it('should handle flow names with leading/trailing whitespace', () => {
      const filename = generateFlowFilename('  Trim Me  ');

      expect(filename).toBe('trim-me-flow.spec.ts');
    });

    it('should handle conflict resolution with existing files', () => {
      const existingFiles = new Map<string, TestFile>();
      existingFiles.set('Login', {
        filename: 'login-flow.spec.ts',
        testCases: [],
        imports: [],
        code: '',
      });

      const filename = generateFlowFilename('Login', existingFiles);

      expect(filename).toBe('login-flow-2.spec.ts');
    });

    it('should increment counter for multiple conflicts', () => {
      const existingFiles = new Map<string, TestFile>();
      existingFiles.set('Login', {
        filename: 'login-flow.spec.ts',
        testCases: [],
        imports: [],
        code: '',
      });
      existingFiles.set('Login 2', {
        filename: 'login-flow-2.spec.ts',
        testCases: [],
        imports: [],
        code: '',
      });

      const filename = generateFlowFilename('Login', existingFiles);

      expect(filename).toBe('login-flow-3.spec.ts');
    });
  });

  describe('generateNavigationFilename', () => {
    it('should return navigation.spec.ts', () => {
      const filename = generateNavigationFilename();

      expect(filename).toBe('navigation.spec.ts');
    });
  });

  describe('generateEmptyResultsFilename', () => {
    it('should return empty-results.spec.ts', () => {
      const filename = generateEmptyResultsFilename();

      expect(filename).toBe('empty-results.spec.ts');
    });
  });

  describe('organizeTestFilesByFlow', () => {
    it('should create map of flow name to test file', () => {
      const flows: UserFlow[] = [
        {
          name: 'Login',
          type: 'login',
          priority: 1,
          pages: [],
          description: 'Login flow',
        },
      ];

      const existingFiles: TestFile[] = [];

      const result = organizeTestFilesByFlow(flows, existingFiles);

      expect(result.size).toBe(1);
      expect(result.get('Login')).toBeDefined();
      expect(result.get('Login')!.filename).toBe('login-flow.spec.ts');
    });

    it('should use existing file if filename matches', () => {
      const flows: UserFlow[] = [
        {
          name: 'Login',
          type: 'login',
          priority: 1,
          pages: [],
          description: 'Login flow',
        },
      ];

      const existingFiles: TestFile[] = [
        {
          filename: 'login-flow.spec.ts',
          testCases: [{ name: 'existing test', type: 'navigation', steps: [], assertions: [] }],
          imports: [],
          code: 'existing code',
        },
      ];

      const result = organizeTestFilesByFlow(flows, existingFiles);

      expect(result.get('Login')!.code).toBe('existing code');
      expect(result.get('Login')!.testCases).toHaveLength(1);
    });

    it('should handle multiple flows', () => {
      const flows: UserFlow[] = [
        {
          name: 'Login',
          type: 'login',
          priority: 1,
          pages: [],
          description: 'Login flow',
        },
        {
          name: 'Checkout',
          type: 'checkout',
          priority: 2,
          pages: [],
          description: 'Checkout flow',
        },
      ];

      const result = organizeTestFilesByFlow(flows, []);

      expect(result.size).toBe(2);
      expect(result.get('Login')!.filename).toBe('login-flow.spec.ts');
      expect(result.get('Checkout')!.filename).toBe('checkout-flow.spec.ts');
    });

    it('should include Playwright import in new test files', () => {
      const flows: UserFlow[] = [
        {
          name: 'Login',
          type: 'login',
          priority: 1,
          pages: [],
          description: 'Login flow',
        },
      ];

      const result = organizeTestFilesByFlow(flows, []);

      expect(result.get('Login')!.imports).toContain(
        "import { test, expect } from '@playwright/test';",
      );
    });

    it('should associate flow with test file', () => {
      const flows: UserFlow[] = [
        {
          name: 'Login',
          type: 'login',
          priority: 1,
          pages: [{ url: 'https://example.com/login', step: 1, role: 'entry' }],
          description: 'Login flow',
        },
      ];

      const result = organizeTestFilesByFlow(flows, []);

      expect(result.get('Login')!.flow).toBeDefined();
      expect(result.get('Login')!.flow!.name).toBe('Login');
    });
  });
});

