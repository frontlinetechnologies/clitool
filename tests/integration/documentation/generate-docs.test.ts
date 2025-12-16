import * as fs from 'fs';
import * as path from 'path';
import { generateDocumentation } from '../../../src/documentation/doc-generator';
import { CrawlResultsInput } from '../../../src/documentation/models';
import { Page } from '../../../src/models/page';
import { CrawlSummary } from '../../../src/models/crawl-summary';

describe('Generate Docs Integration', () => {
  it('should generate documentation from sample crawl results', async () => {
    // Read sample crawl results
    const fixturePath = path.join(__dirname, '../../fixtures/crawl-results/sample-basic.json');
    const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
    const jsonData = JSON.parse(fixtureContent);

    // Parse into CrawlResultsInput format
    const crawlResults: CrawlResultsInput = {
      summary: jsonData.summary as CrawlSummary,
      pages: jsonData.pages as Page[],
      forms: jsonData.forms || [],
      buttons: jsonData.buttons || [],
      inputFields: jsonData.inputFields || [],
    };

    // Generate documentation
    const documentation = await generateDocumentation(crawlResults);

    // Verify basic structure
    expect(documentation).toBeDefined();
    expect(documentation.title).toBe('Site Documentation');
    expect(documentation.summary.totalPages).toBe(3);
    expect(documentation.summary.totalForms).toBe(1);
    expect(documentation.summary.totalButtons).toBe(2);
    expect(documentation.summary.totalInputFields).toBe(3);
    expect(documentation.pageDetails).toHaveLength(3);
    expect(documentation.generatedAt).toBeDefined();
  });

  it('should handle empty crawl results', async () => {
    const emptyResults: CrawlResultsInput = {
      summary: {
        totalPages: 0,
        totalForms: 0,
        totalButtons: 0,
        totalInputFields: 0,
        errors: 0,
        skipped: 0,
        interrupted: false,
        startTime: '2024-01-01T00:00:00Z',
      },
      pages: [],
      forms: [],
      buttons: [],
      inputFields: [],
    };

    const documentation = await generateDocumentation(emptyResults);

    expect(documentation).toBeDefined();
    expect(documentation.summary.totalPages).toBe(0);
    expect(documentation.pageDetails).toHaveLength(0);
  });

  it('should include page details for all pages', async () => {
    const fixturePath = path.join(__dirname, '../../fixtures/crawl-results/sample-basic.json');
    const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
    const jsonData = JSON.parse(fixtureContent);

    const crawlResults: CrawlResultsInput = {
      summary: jsonData.summary as CrawlSummary,
      pages: jsonData.pages as Page[],
      forms: jsonData.forms || [],
      buttons: jsonData.buttons || [],
      inputFields: jsonData.inputFields || [],
    };

    const documentation = await generateDocumentation(crawlResults);

    // Verify all pages are included
    expect(documentation.pageDetails.length).toBe(crawlResults.pages.length);
    
    // Verify page URLs match
    const docUrls = documentation.pageDetails.map((p) => p.url).sort();
    const crawlUrls = crawlResults.pages.map((p) => p.url).sort();
    expect(docUrls).toEqual(crawlUrls);
  });

  it('should aggregate forms and buttons per page', async () => {
    const fixturePath = path.join(__dirname, '../../fixtures/crawl-results/sample-basic.json');
    const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
    const jsonData = JSON.parse(fixtureContent);

    const crawlResults: CrawlResultsInput = {
      summary: jsonData.summary as CrawlSummary,
      pages: jsonData.pages as Page[],
      forms: jsonData.forms || [],
      buttons: jsonData.buttons || [],
      inputFields: jsonData.inputFields || [],
    };

    const documentation = await generateDocumentation(crawlResults);

    // Find contact page
    const contactPage = documentation.pageDetails.find((p) => p.url === 'https://example.com/contact');
    expect(contactPage).toBeDefined();
    expect(contactPage?.forms).toHaveLength(1);
    expect(contactPage?.forms?.[0].action).toBe('/contact');
    expect(contactPage?.buttons).toBeDefined();
  });
});

