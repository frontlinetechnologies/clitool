import { parseCrawlResults } from '../../../src/documentation/crawl-results-parser';
import * as readline from 'readline';

// Mock readline module
jest.mock('readline', () => {
  return {
    createInterface: jest.fn(),
  };
});

describe('Crawl Results Parser', () => {
  let mockRl: any;
  let lineHandlers: Array<(line: string) => void>;
  let closeHandlers: Array<() => void>;

  beforeEach(() => {
    lineHandlers = [];
    closeHandlers = [];
    mockRl = {
      on: jest.fn((event: string, handler: any) => {
        if (event === 'line') {
          lineHandlers.push(handler);
        } else if (event === 'close') {
          closeHandlers.push(handler);
        }
      }),
    };
    (readline.createInterface as jest.Mock).mockReturnValue(mockRl);
  });

  const simulateStdin = (content: string) => {
    // Trigger line handlers synchronously
    const lines = content.split('\n');
    lines.forEach((line) => {
      lineHandlers.forEach((handler) => handler(line));
    });
    // Trigger close handlers
    closeHandlers.forEach((handler) => handler());
  };

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

  it('should handle missing optional fields', async () => {
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

    expect(result.summary.totalPages).toBe(0);
    expect(result.pages).toHaveLength(0);
    expect(result.forms).toEqual([]);
    expect(result.buttons).toEqual([]);
    expect(result.inputFields).toEqual([]);
  });

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
          url: 'https://example.com/form',
          status: 200,
          discoveredAt: '2024-01-01T00:00:00Z',
        },
      ],
      forms: [
        {
          id: 'login-form',
          action: '/login',
          method: 'POST',
          pageUrl: 'https://example.com/form',
          inputFields: [
            {
              type: 'email',
              name: 'email',
              required: true,
              pageUrl: 'https://example.com/form',
            },
            {
              type: 'password',
              name: 'password',
              required: true,
              pageUrl: 'https://example.com/form',
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
    expect(result.forms!).toHaveLength(1);
    expect(result.forms![0].id).toBe('login-form');
    expect(result.forms![0].action).toBe('/login');
    expect(result.forms![0].inputFields).toHaveLength(2);
  });

  it('should throw error for invalid JSON', async () => {
    const parsePromise = parseCrawlResults();
    simulateStdin('invalid json {');

    await expect(parsePromise).rejects.toThrow();
  });

  it('should throw error for missing required fields', async () => {
    const jsonInput = JSON.stringify({
      summary: {
        totalPages: 0,
      },
    });

    const parsePromise = parseCrawlResults();
    simulateStdin(jsonInput);

    await expect(parsePromise).rejects.toThrow();
  });

  it('should handle pages with links', async () => {
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
          links: ['https://example.com/about', 'https://example.com/contact'],
        },
      ],
      forms: [],
      buttons: [],
      inputFields: [],
    });

    const parsePromise = parseCrawlResults();
    simulateStdin(jsonInput);
    const result = await parsePromise;

    expect(result.pages[0].links).toEqual(['https://example.com/about', 'https://example.com/contact']);
  });
});

