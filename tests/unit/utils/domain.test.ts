import { extractDomain, isSameDomain, getBaseURL } from '../../../src/utils/domain';

describe('Domain Utilities', () => {
  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://example.com/page')).toBe('example.com');
      expect(extractDomain('http://subdomain.example.com/path')).toBe('subdomain.example.com');
    });

    it('should handle URLs with ports', () => {
      expect(extractDomain('https://example.com:8080/page')).toBe('example.com');
    });

    it('should throw error for invalid URL', () => {
      expect(() => extractDomain('not-a-url')).toThrow();
    });
  });

  describe('isSameDomain', () => {
    it('should return true for same domain', () => {
      expect(isSameDomain('https://example.com/page1', 'https://example.com/page2')).toBe(true);
    });

    it('should return false for different domains', () => {
      expect(isSameDomain('https://example.com', 'https://other.com')).toBe(false);
    });

    it('should handle invalid URLs gracefully', () => {
      expect(isSameDomain('invalid', 'https://example.com')).toBe(false);
    });
  });

  describe('getBaseURL', () => {
    it('should extract base URL', () => {
      expect(getBaseURL('https://example.com/page')).toBe('https://example.com');
      expect(getBaseURL('http://example.com:8080/path')).toBe('http://example.com');
    });
  });
});

