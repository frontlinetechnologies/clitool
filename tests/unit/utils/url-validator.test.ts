import { validateURL } from '../../../src/utils/url-validator';
import { CrawlError, ErrorType } from '../../../src/utils/errors';

describe('URL Validator', () => {
  it('should accept valid HTTP URLs', () => {
    expect(() => validateURL('http://example.com')).not.toThrow();
    expect(() => validateURL('https://example.com')).not.toThrow();
  });

  it('should reject invalid URLs', () => {
    expect(() => validateURL('not-a-url')).toThrow();
    expect(() => validateURL('')).toThrow();
  });

  it('should reject non-HTTP protocols', () => {
    expect(() => validateURL('ftp://example.com')).toThrow();
    expect(() => validateURL('file:///path')).toThrow();
  });

  it('should reject localhost URLs', () => {
    expect(() => validateURL('http://localhost')).toThrow();
    expect(() => validateURL('http://127.0.0.1')).toThrow();
  });

  it('should reject private IP addresses', () => {
    expect(() => validateURL('http://192.168.1.1')).toThrow();
    expect(() => validateURL('http://10.0.0.1')).toThrow();
    expect(() => validateURL('http://172.16.0.1')).toThrow();
  });
});

