import {
  createPage,
  markPageProcessed,
  addLinksToPage,
  setPageError,
  Page,
} from '../../../src/models/page';

describe('Page Model', () => {
  it('should create a page with required fields', () => {
    const page = createPage('https://example.com', 200);

    expect(page.url).toBe('https://example.com');
    expect(page.status).toBe(200);
    expect(page.discoveredAt).toBeDefined();
  });

  it('should mark page as processed', () => {
    const page = createPage('https://example.com', 200);
    const processed = markPageProcessed(page);

    expect(processed.processedAt).toBeDefined();
    expect(processed.processedAt).not.toBeUndefined();
  });

  it('should add links to page', () => {
    const page = createPage('https://example.com', 200);
    const links = ['https://example.com/page1', 'https://example.com/page2'];
    const pageWithLinks = addLinksToPage(page, links);

    expect(pageWithLinks.links).toEqual(links);
  });

  it('should set error on page', () => {
    const page = createPage('https://example.com', 0);
    const errorPage = setPageError(page, 'Network error');

    expect(errorPage.error).toBe('Network error');
  });
});

