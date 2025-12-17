/**
 * Unit tests for crawl configuration types.
 */

import {
  CrawlConfig,
  QueueItem,
  createDefaultCrawlConfig,
  mergeCrawlConfig,
} from '../../../src/crawler/crawl-config';

describe('createDefaultCrawlConfig', () => {
  it('should return config with all undefined limits', () => {
    const config = createDefaultCrawlConfig();
    expect(config.maxPages).toBeUndefined();
    expect(config.maxDepth).toBeUndefined();
    expect(config.includePatterns).toBeUndefined();
    expect(config.excludePatterns).toBeUndefined();
  });
});

describe('mergeCrawlConfig', () => {
  it('should return defaults when no config provided', () => {
    const config = mergeCrawlConfig();
    expect(config.maxPages).toBeUndefined();
    expect(config.maxDepth).toBeUndefined();
  });

  it('should merge maxPages with defaults', () => {
    const config = mergeCrawlConfig({ maxPages: 100 });
    expect(config.maxPages).toBe(100);
    expect(config.maxDepth).toBeUndefined();
  });

  it('should merge maxDepth with defaults', () => {
    const config = mergeCrawlConfig({ maxDepth: 3 });
    expect(config.maxPages).toBeUndefined();
    expect(config.maxDepth).toBe(3);
  });

  it('should merge include patterns', () => {
    const config = mergeCrawlConfig({ includePatterns: ['**/api/**'] });
    expect(config.includePatterns).toEqual(['**/api/**']);
  });

  it('should merge exclude patterns', () => {
    const config = mergeCrawlConfig({ excludePatterns: ['**/admin/**'] });
    expect(config.excludePatterns).toEqual(['**/admin/**']);
  });

  it('should merge all options together', () => {
    const config = mergeCrawlConfig({
      maxPages: 50,
      maxDepth: 2,
      includePatterns: ['**/products/**'],
      excludePatterns: ['**/admin/**'],
    });
    expect(config.maxPages).toBe(50);
    expect(config.maxDepth).toBe(2);
    expect(config.includePatterns).toEqual(['**/products/**']);
    expect(config.excludePatterns).toEqual(['**/admin/**']);
  });

  it('should handle empty config object', () => {
    const config = mergeCrawlConfig({});
    expect(config.maxPages).toBeUndefined();
    expect(config.maxDepth).toBeUndefined();
  });

  it('should handle explicit undefined values', () => {
    const config = mergeCrawlConfig({
      maxPages: undefined,
      maxDepth: undefined,
    });
    expect(config.maxPages).toBeUndefined();
    expect(config.maxDepth).toBeUndefined();
  });

  it('should accept zero as valid maxDepth', () => {
    const config = mergeCrawlConfig({ maxDepth: 0 });
    expect(config.maxDepth).toBe(0);
  });
});

describe('QueueItem interface', () => {
  it('should support url and depth properties', () => {
    const item: QueueItem = {
      url: 'https://example.com/page',
      depth: 2,
    };
    expect(item.url).toBe('https://example.com/page');
    expect(item.depth).toBe(2);
  });
});

describe('CrawlConfig interface', () => {
  it('should support all optional properties', () => {
    const config: CrawlConfig = {
      maxPages: 100,
      maxDepth: 5,
      includePatterns: ['**/api/**', '**/products/**'],
      excludePatterns: ['**/admin/**', '/\\.pdf$/'],
    };
    expect(config.maxPages).toBe(100);
    expect(config.maxDepth).toBe(5);
    expect(config.includePatterns).toHaveLength(2);
    expect(config.excludePatterns).toHaveLength(2);
  });

  it('should allow empty config', () => {
    const config: CrawlConfig = {};
    expect(config.maxPages).toBeUndefined();
    expect(config.maxDepth).toBeUndefined();
  });
});
