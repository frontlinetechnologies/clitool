/**
 * Unit tests for URL filter utility.
 */

import {
  createURLFilter,
  createPermissiveFilter,
} from '../../../src/utils/url-filter';

describe('createURLFilter', () => {
  describe('with no patterns', () => {
    it('should allow all URLs', () => {
      const filter = createURLFilter();
      expect(filter.shouldCrawl('https://example.com')).toBe(true);
      expect(filter.shouldCrawl('https://example.com/any/path')).toBe(true);
    });
  });

  describe('with include patterns only', () => {
    it('should allow URLs matching glob pattern', () => {
      const filter = createURLFilter(['**/products/**']);
      expect(filter.shouldCrawl('https://example.com/products/item')).toBe(true);
      expect(filter.shouldCrawl('https://example.com/shop/products/item')).toBe(true);
    });

    it('should reject URLs not matching glob pattern', () => {
      const filter = createURLFilter(['**/products/**']);
      expect(filter.shouldCrawl('https://example.com/about')).toBe(false);
      expect(filter.shouldCrawl('https://example.com/cart')).toBe(false);
    });

    it('should allow URLs matching regex pattern', () => {
      const filter = createURLFilter(['/\\/api\\/v[0-9]+\\//']);
      expect(filter.shouldCrawl('https://example.com/api/v1/users')).toBe(true);
      expect(filter.shouldCrawl('https://example.com/api/v2/products')).toBe(true);
    });

    it('should reject URLs not matching regex pattern', () => {
      const filter = createURLFilter(['/\\/api\\/v[0-9]+\\//']);
      expect(filter.shouldCrawl('https://example.com/api/users')).toBe(false);
      expect(filter.shouldCrawl('https://example.com/products')).toBe(false);
    });

    it('should allow URLs matching any of multiple patterns', () => {
      const filter = createURLFilter(['**/products/**', '**/cart/**']);
      expect(filter.shouldCrawl('https://example.com/products/item')).toBe(true);
      expect(filter.shouldCrawl('https://example.com/cart/checkout')).toBe(true);
    });
  });

  describe('with exclude patterns only', () => {
    it('should reject URLs matching glob pattern', () => {
      const filter = createURLFilter(undefined, ['**/admin/**']);
      expect(filter.shouldCrawl('https://example.com/admin/dashboard')).toBe(false);
      expect(filter.shouldCrawl('https://example.com/site/admin/settings')).toBe(false);
    });

    it('should allow URLs not matching glob pattern', () => {
      const filter = createURLFilter(undefined, ['**/admin/**']);
      expect(filter.shouldCrawl('https://example.com/products')).toBe(true);
      expect(filter.shouldCrawl('https://example.com/about')).toBe(true);
    });

    it('should reject URLs matching regex pattern', () => {
      const filter = createURLFilter(undefined, ['/\\.(pdf|doc|docx)$/']);
      expect(filter.shouldCrawl('https://example.com/file.pdf')).toBe(false);
      expect(filter.shouldCrawl('https://example.com/docs/report.docx')).toBe(false);
    });

    it('should allow URLs not matching regex pattern', () => {
      const filter = createURLFilter(undefined, ['/\\.(pdf|doc|docx)$/']);
      expect(filter.shouldCrawl('https://example.com/page.html')).toBe(true);
      expect(filter.shouldCrawl('https://example.com/products')).toBe(true);
    });
  });

  describe('with both include and exclude patterns', () => {
    it('should apply include first, then exclude', () => {
      // Include products, but exclude admin products
      const filter = createURLFilter(['**/products/**'], ['**/admin/**']);

      // Products allowed
      expect(filter.shouldCrawl('https://example.com/products/item')).toBe(true);

      // Admin products excluded (matches both, but exclude wins)
      expect(filter.shouldCrawl('https://example.com/admin/products/item')).toBe(false);

      // Non-products excluded by include filter
      expect(filter.shouldCrawl('https://example.com/about')).toBe(false);
    });

    it('should handle mixed glob and regex patterns', () => {
      const filter = createURLFilter(
        ['**/api/**', '/\\/v[0-9]+\\//'],
        ['/\\.(json|xml)$/'],
      );

      // API URLs allowed
      expect(filter.shouldCrawl('https://example.com/api/users')).toBe(true);

      // Versioned URLs allowed
      expect(filter.shouldCrawl('https://example.com/v1/products')).toBe(true);

      // JSON files excluded
      expect(filter.shouldCrawl('https://example.com/api/data.json')).toBe(false);

      // Non-matching URLs excluded by include
      expect(filter.shouldCrawl('https://example.com/about')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty include array', () => {
      const filter = createURLFilter([]);
      expect(filter.shouldCrawl('https://example.com/any')).toBe(true);
    });

    it('should handle empty exclude array', () => {
      const filter = createURLFilter(undefined, []);
      expect(filter.shouldCrawl('https://example.com/any')).toBe(true);
    });

    it('should handle invalid regex gracefully', () => {
      // Invalid regex (unclosed bracket) should be treated as glob
      const filter = createURLFilter(['/[invalid/']);
      // Should not throw and should work as glob pattern
      expect(() => filter.shouldCrawl('https://example.com/test')).not.toThrow();
    });

    it('should handle complex URLs', () => {
      const filter = createURLFilter(['**/products/**']);
      expect(
        filter.shouldCrawl('https://example.com/products/123?utm_source=google&ref=abc'),
      ).toBe(true);
    });
  });
});

describe('createPermissiveFilter', () => {
  it('should allow all URLs', () => {
    const filter = createPermissiveFilter();
    expect(filter.shouldCrawl('https://example.com')).toBe(true);
    expect(filter.shouldCrawl('https://example.com/admin/secret')).toBe(true);
    expect(filter.shouldCrawl('https://example.com/file.pdf')).toBe(true);
  });
});
