import { parseCrawlResults } from '../../../src/test-generation/crawl-results-parser';
import * as readline from 'readline';

// Mock readline module to simulate stdin
jest.mock('readline', () => {
  return {
    createInterface: jest.fn(),
  };
});

describe('Test Generation Crawl Results Parser', () => {
  let mockRl: any;
  let lineHandlers: Array<(line: string) => void>;
  let closeHandlers: Array<() => void>;
  let errorHandlers: Array<(error: Error) => void>;

  beforeEach(() => {
    lineHandlers = [];
    closeHandlers = [];
    errorHandlers = [];
    mockRl = {
      on: jest.fn((event: string, handler: any) => {
        if (event === 'line') {
          lineHandlers.push(handler);
        } else if (event === 'close') {
          closeHandlers.push(handler);
        } else if (event === 'error') {
          errorHandlers.push(handler);
        }
        return mockRl;
      }),
    };
    (readline.createInterface as jest.Mock).mockReturnValue(mockRl);
  });

  const simulateStdin = (content: string) => {
    const lines = content.split('\n');
    lines.forEach((line) => {
      lineHandlers.forEach((handler) => handler(line));
    });
    closeHandlers.forEach((handler) => handler());
  };

  describe('JSON parsing', () => {
    it('should parse valid crawl results JSON', async () => {
      const jsonInput = JSON.stringify({
        summary: {
          totalPages: 2,
          totalForms: 1,
          totalButtons: 3,
          totalInputFields: 4,
          errors: 0,
          skipped: 0,
          interrupted: false,
          startTime: '2024-01-01T00:00:00Z',
        },
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
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);
      const result = await parsePromise;

      expect(result.summary.totalPages).toBe(2);
      expect(result.summary.totalForms).toBe(1);
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].url).toBe('https://example.com');
      expect(result.pages[0].status).toBe(200);
      expect(result.pages[0].title).toBe('Example');
    });

    it('should throw PARSE_ERROR for invalid JSON', async () => {
      const parsePromise = parseCrawlResults();
      simulateStdin('invalid json {');

      await expect(parsePromise).rejects.toThrow();
      try {
        await parsePromise;
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe('TestGenerationError');
      }
    });

    it('should handle multiline JSON input', async () => {
      const jsonInput = `{
        "summary": {
          "totalPages": 1,
          "totalForms": 0,
          "totalButtons": 0,
          "totalInputFields": 0,
          "errors": 0,
          "skipped": 0,
          "interrupted": false,
          "startTime": "2024-01-01T00:00:00Z"
        },
        "pages": [
          {
            "url": "https://example.com",
            "status": 200,
            "discoveredAt": "2024-01-01T00:00:00Z"
          }
        ]
      }`;

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);
      const result = await parsePromise;

      expect(result.summary.totalPages).toBe(1);
      expect(result.pages).toHaveLength(1);
    });
  });

  describe('schema validation', () => {
    it('should throw VALIDATION_ERROR for missing summary', async () => {
      const jsonInput = JSON.stringify({
        pages: [],
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);

      await expect(parsePromise).rejects.toThrow('Missing required fields');
    });

    it('should throw VALIDATION_ERROR for missing pages', async () => {
      const jsonInput = JSON.stringify({
        summary: {
          totalPages: 0,
          totalForms: 0,
          totalButtons: 0,
          totalInputFields: 0,
          errors: 0,
          skipped: 0,
          interrupted: false,
          startTime: '2024-01-01T00:00:00Z',
        },
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);

      await expect(parsePromise).rejects.toThrow('Missing required fields');
    });
  });

  describe('optional fields handling', () => {
    it('should handle missing optional arrays', async () => {
      const jsonInput = JSON.stringify({
        summary: {
          totalPages: 0,
          totalForms: 0,
          totalButtons: 0,
          totalInputFields: 0,
          errors: 0,
          skipped: 0,
          interrupted: false,
          startTime: '2024-01-01T00:00:00Z',
        },
        pages: [],
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);
      const result = await parsePromise;

      expect(result.forms).toEqual([]);
      expect(result.buttons).toEqual([]);
      expect(result.inputFields).toEqual([]);
    });

    it('should handle pages with missing optional fields', async () => {
      const jsonInput = JSON.stringify({
        summary: {
          totalPages: 1,
          totalForms: 0,
          totalButtons: 0,
          totalInputFields: 0,
          errors: 0,
          skipped: 0,
          interrupted: false,
          startTime: '2024-01-01T00:00:00Z',
        },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);
      const result = await parsePromise;

      expect(result.pages[0].title).toBeUndefined();
      expect(result.pages[0].links).toBeUndefined();
      expect(result.pages[0].processedAt).toBeUndefined();
    });

    it('should handle summary with missing optional fields', async () => {
      const jsonInput = JSON.stringify({
        summary: {
          totalPages: 1,
          totalForms: 0,
          totalButtons: 0,
          totalInputFields: 0,
          errors: 0,
          skipped: 0,
          interrupted: false,
          startTime: '2024-01-01T00:00:00Z',
        },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);
      const result = await parsePromise;

      expect(result.summary.endTime).toBeUndefined();
      expect(result.summary.duration).toBeUndefined();
    });
  });

  describe('forms parsing', () => {
    it('should parse forms with input fields', async () => {
      const jsonInput = JSON.stringify({
        summary: {
          totalPages: 1,
          totalForms: 1,
          totalButtons: 0,
          totalInputFields: 2,
          errors: 0,
          skipped: 0,
          interrupted: false,
          startTime: '2024-01-01T00:00:00Z',
        },
        pages: [
          {
            url: 'https://example.com/login',
            status: 200,
            discoveredAt: '2024-01-01T00:00:00Z',
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
                required: true,
                pageUrl: 'https://example.com/login',
              },
              {
                type: 'password',
                name: 'password',
                required: true,
                pageUrl: 'https://example.com/login',
              },
            ],
          },
        ],
        buttons: [],
        inputFields: [],
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);
      const result = await parsePromise;

      expect(result.forms).toBeDefined();
      expect(result.forms).toHaveLength(1);
      expect(result.forms![0].id).toBe('login-form');
      expect(result.forms![0].action).toBe('/login');
      expect(result.forms![0].method).toBe('POST');
      expect(result.forms![0].inputFields).toHaveLength(2);
      expect(result.forms![0].inputFields![0].type).toBe('email');
      expect(result.forms![0].inputFields![1].type).toBe('password');
    });

    it('should handle forms without input fields', async () => {
      const jsonInput = JSON.stringify({
        summary: {
          totalPages: 1,
          totalForms: 1,
          totalButtons: 0,
          totalInputFields: 0,
          errors: 0,
          skipped: 0,
          interrupted: false,
          startTime: '2024-01-01T00:00:00Z',
        },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [
          {
            action: '/submit',
            method: 'POST',
            pageUrl: 'https://example.com',
          },
        ],
        buttons: [],
        inputFields: [],
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);
      const result = await parsePromise;

      expect(result.forms).toHaveLength(1);
      expect(result.forms![0].inputFields).toBeUndefined();
    });
  });

  describe('buttons parsing', () => {
    it('should parse buttons correctly', async () => {
      const jsonInput = JSON.stringify({
        summary: {
          totalPages: 1,
          totalForms: 0,
          totalButtons: 2,
          totalInputFields: 0,
          errors: 0,
          skipped: 0,
          interrupted: false,
          startTime: '2024-01-01T00:00:00Z',
        },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [],
        buttons: [
          {
            type: 'submit',
            text: 'Submit',
            id: 'submit-btn',
            pageUrl: 'https://example.com',
            formId: 'main-form',
          },
          {
            type: 'button',
            text: 'Click Me',
            pageUrl: 'https://example.com',
          },
        ],
        inputFields: [],
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);
      const result = await parsePromise;

      expect(result.buttons).toHaveLength(2);
      expect(result.buttons![0].type).toBe('submit');
      expect(result.buttons![0].text).toBe('Submit');
      expect(result.buttons![0].id).toBe('submit-btn');
      expect(result.buttons![0].formId).toBe('main-form');
      expect(result.buttons![1].type).toBe('button');
      expect(result.buttons![1].formId).toBeUndefined();
    });
  });

  describe('input fields parsing', () => {
    it('should parse input fields with placeholders', async () => {
      const jsonInput = JSON.stringify({
        summary: {
          totalPages: 1,
          totalForms: 0,
          totalButtons: 0,
          totalInputFields: 1,
          errors: 0,
          skipped: 0,
          interrupted: false,
          startTime: '2024-01-01T00:00:00Z',
        },
        pages: [
          {
            url: 'https://example.com',
            status: 200,
            discoveredAt: '2024-01-01T00:00:00Z',
          },
        ],
        forms: [],
        buttons: [],
        inputFields: [
          {
            type: 'text',
            name: 'search',
            id: 'search-input',
            placeholder: 'Search...',
            required: false,
            pageUrl: 'https://example.com',
          },
        ],
      });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);
      const result = await parsePromise;

      expect(result.inputFields).toHaveLength(1);
      expect(result.inputFields![0].placeholder).toBe('Search...');
      expect(result.inputFields![0].required).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should produce error with correct type for invalid JSON', async () => {
      const parsePromise = parseCrawlResults();
      simulateStdin('{invalid:');

      try {
        await parsePromise;
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as any).name).toBe('TestGenerationError');
        // The error type should be PARSE_ERROR for JSON syntax errors
      }
    });

    it('should produce error with correct type for missing required fields', async () => {
      const jsonInput = JSON.stringify({ pages: [] });

      const parsePromise = parseCrawlResults();
      simulateStdin(jsonInput);

      try {
        await parsePromise;
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as any).name).toBe('TestGenerationError');
        // The error type should be VALIDATION_ERROR
      }
    });
  });
});

