import { formatAsText } from '../../../src/output/text-formatter';
import { CrawlResults } from '../../../src/output/json-formatter';
import { createCrawlSummary } from '../../../src/models/crawl-summary';
import { createPage } from '../../../src/models/page';

describe('Text Formatter', () => {
  it('should format basic crawl summary', () => {
    const summary = createCrawlSummary();
    summary.totalPages = 10;
    summary.totalForms = 5;
    summary.totalButtons = 8;
    summary.totalInputFields = 12;
    summary.errors = 2;
    summary.skipped = 1;
    summary.duration = 125; // 2m 5s

    const results: CrawlResults = {
      summary,
      pages: [],
      forms: [],
      buttons: [],
      inputFields: [],
    };

    const output = formatAsText(results);

    expect(output).toContain('Total Pages: 10');
    expect(output).toContain('Total Forms: 5');
    expect(output).toContain('Total Buttons: 8');
    expect(output).toContain('Total Input Fields: 12');
    expect(output).toContain('Errors: 2');
    expect(output).toContain('Skipped: 1');
    expect(output).toContain('Duration: 2m 5s');
  });

  it('should include error summary when errors exist', () => {
    const summary = createCrawlSummary();
    summary.errors = 2;

    const page1 = createPage('https://example.com/error1', 404);
    const page2 = createPage('https://example.com/error2', 500);

    const results: CrawlResults = {
      summary,
      pages: [page1, page2],
      forms: [],
      buttons: [],
      inputFields: [],
    };

    const output = formatAsText(results);

    expect(output).toContain('Error Summary:');
    expect(output).toContain('https://example.com/error1');
    expect(output).toContain('https://example.com/error2');
  });

  it('should show interrupted warning when crawl was interrupted', () => {
    const summary = createCrawlSummary();
    summary.interrupted = true;

    const results: CrawlResults = {
      summary,
      pages: [],
      forms: [],
      buttons: [],
      inputFields: [],
    };

    const output = formatAsText(results);

    expect(output).toContain('⚠️  Crawl was interrupted');
  });
});

