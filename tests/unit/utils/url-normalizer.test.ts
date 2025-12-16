import { normalizeURL, deduplicateURLs } from '../../../src/crawler/url-normalizer';

describe('URL Normalizer', () => {
  describe('normalizeURL', () => {
    it('should remove fragments from URLs', () => {
      expect(normalizeURL('https://example.com/page#section')).toBe(
        'https://example.com/page/',
      );
    });

    it('should normalize trailing slashes for directory-like paths', () => {
      expect(normalizeURL('https://example.com/page')).toBe(
        'https://example.com/page/',
      );
      expect(normalizeURL('https://example.com/page/')).toBe(
        'https://example.com/page/',
      );
    });

    it('should preserve query strings', () => {
      expect(normalizeURL('https://example.com/page?param=value')).toBe(
        'https://example.com/page/?param=value',
      );
      expect(normalizeURL('https://example.com/page?param=value#section')).toBe(
        'https://example.com/page/?param=value',
      );
    });

    it('should not add trailing slash to files with extensions', () => {
      expect(normalizeURL('https://example.com/page.html')).toBe(
        'https://example.com/page.html',
      );
      expect(normalizeURL('https://example.com/page.html/')).toBe(
        'https://example.com/page.html',
      );
    });

    it('should handle root path', () => {
      expect(normalizeURL('https://example.com')).toBe('https://example.com/');
      expect(normalizeURL('https://example.com/')).toBe('https://example.com/');
    });

    it('should handle complex URLs', () => {
      expect(
        normalizeURL('https://example.com/products?category=electronics#top'),
      ).toBe('https://example.com/products/?category=electronics');
    });
  });

  describe('deduplicateURLs', () => {
    it('should remove duplicate URLs after normalization', () => {
      const urls = [
        'https://example.com/page',
        'https://example.com/page/',
        'https://example.com/page#section',
      ];
      const result = deduplicateURLs(urls);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('https://example.com/page/');
    });

    it('should preserve unique URLs', () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3',
      ];
      const result = deduplicateURLs(urls);
      expect(result).toHaveLength(3);
    });

    it('should handle empty array', () => {
      expect(deduplicateURLs([])).toEqual([]);
    });

    it('should preserve query strings when deduplicating', () => {
      const urls = [
        'https://example.com/page?param=value',
        'https://example.com/page/?param=value',
      ];
      const result = deduplicateURLs(urls);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('param=value');
    });
  });
});

