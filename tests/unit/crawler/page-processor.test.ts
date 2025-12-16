import { PageProcessor } from '../../../src/crawler/page-processor';
import { Page } from '../../../src/models/page';
import { Browser, Page as PlaywrightPage } from 'playwright';

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

describe('Page Processor', () => {
  let processor: PageProcessor;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<PlaywrightPage>;

  beforeEach(() => {
    mockPage = {
      goto: jest.fn(),
      content: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<PlaywrightPage>;

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    } as unknown as jest.Mocked<Browser>;

    const { chromium } = require('playwright');
    chromium.launch = jest.fn().mockResolvedValue(mockBrowser);

    processor = new PageProcessor('https://example.com');
  });

  afterEach(async () => {
    await processor.close();
  });

  it('should discover links from page HTML', async () => {
    const html = `
      <html>
        <body>
          <a href="/page1">Page 1</a>
          <a href="/page2">Page 2</a>
          <a href="https://external.com">External</a>
        </body>
      </html>
    `;

    mockPage.goto.mockResolvedValue(null);
    mockPage.content.mockResolvedValue(html);

    const result = await processor.processPage('https://example.com/');

    expect(result.page.status).toBe(200);
    expect(result.links).toContain('https://example.com/page1/');
    expect(result.links).toContain('https://example.com/page2/');
    expect(result.links).not.toContain('https://external.com');
  });

  it('should extract page title', async () => {
    const html = '<html><head><title>Test Page</title></head><body></body></html>';

    mockPage.goto.mockResolvedValue(null);
    mockPage.content.mockResolvedValue(html);

    const result = await processor.processPage('https://example.com/');

    expect(result.page.title).toBe('Test Page');
  });

  it('should handle network errors', async () => {
    mockPage.goto.mockRejectedValue(new Error('Network error'));

    const result = await processor.processPage('https://example.com/');

    expect(result.page.status).toBe(0);
    expect(result.page.error).toBeDefined();
  });

  it('should handle redirects', async () => {
    mockPage.goto.mockResolvedValue({
      status: () => 301,
      url: () => 'https://example.com/new-page',
    } as any);

    const html = '<html><body></body></html>';
    mockPage.content.mockResolvedValue(html);

    const result = await processor.processPage('https://example.com/old');

    expect(result.page.status).toBe(301);
  });
});

