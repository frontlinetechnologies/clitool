import { createRobotsChecker } from '../../src/parsers/robots-parser';

// Mock fetch
global.fetch = jest.fn();

describe('Robots.txt Compliance Integration', () => {
  it('should respect robots.txt disallowed paths during crawl', async () => {
    const robotsTxt = `
      User-agent: *
      Disallow: /private/
      Allow: /public/
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => robotsTxt,
    });

    const checker = await createRobotsChecker('https://example.com');

    expect(checker.isAllowed('https://example.com/private/page')).toBe(false);
    expect(checker.isAllowed('https://example.com/public/page')).toBe(true);
  });
});

