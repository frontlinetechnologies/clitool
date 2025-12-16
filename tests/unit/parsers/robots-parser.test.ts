import { createRobotsChecker } from '../../../src/parsers/robots-parser';

// Mock fetch
global.fetch = jest.fn();

describe('Robots Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow all URLs when robots.txt does not exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const checker = await createRobotsChecker('https://example.com');
    expect(checker.isAllowed('https://example.com/page')).toBe(true);
  });

  it('should respect disallowed paths from robots.txt', async () => {
    const robotsTxt = `
      User-agent: *
      Disallow: /admin/
      Disallow: /private/
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => robotsTxt,
    });

    const checker = await createRobotsChecker('https://example.com');
    expect(checker.isAllowed('https://example.com/admin/')).toBe(false);
    expect(checker.isAllowed('https://example.com/page')).toBe(true);
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const checker = await createRobotsChecker('https://example.com');
    // Should default to allowing when robots.txt cannot be fetched
    expect(checker.isAllowed('https://example.com/page')).toBe(true);
  });
});

