import { formatAsJSON } from '../../src/output/json-formatter';
import { formatAsText } from '../../src/output/text-formatter';
import { CrawlResults } from '../../src/output/json-formatter';
import { createCrawlSummary } from '../../src/models/crawl-summary';

describe('Output Format Integration', () => {
  it('should format results as JSON', () => {
    const summary = createCrawlSummary();
    summary.totalPages = 5;

    const results: CrawlResults = {
      summary,
      pages: [],
      forms: [],
      buttons: [],
      inputFields: [],
    };

    const json = formatAsJSON(results);
    const parsed = JSON.parse(json);

    expect(parsed.summary).toBeDefined();
    expect(parsed.pages).toEqual([]);
    expect(parsed.forms).toEqual([]);
  });

  it('should format results as text', () => {
    const summary = createCrawlSummary();
    summary.totalPages = 5;

    const results: CrawlResults = {
      summary,
      pages: [],
      forms: [],
      buttons: [],
      inputFields: [],
    };

    const text = formatAsText(results);

    expect(text).toContain('Crawl Summary');
    expect(text).toContain('Total Pages: 5');
  });
});

