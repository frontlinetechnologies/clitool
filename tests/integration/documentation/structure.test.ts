import * as fs from 'fs';
import * as path from 'path';
import { generateDocumentation } from '../../../src/documentation/doc-generator';
import { CrawlResultsInput } from '../../../src/documentation/models';
import { Page } from '../../../src/models/page';
import { CrawlSummary } from '../../../src/models/crawl-summary';

describe('Structure Documentation Integration', () => {
  it('should generate documentation with site structure', async () => {
    const fixturePath = path.join(__dirname, '../../fixtures/crawl-results/sample-with-structure.json');
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

    expect(documentation.siteStructure).toBeDefined();
    expect(documentation.siteStructure.homePage).toBe('https://example.com');
    expect(documentation.siteStructure.sections.length).toBeGreaterThan(0);
    
    // Should have Products section
    const productsSection = documentation.siteStructure.sections.find((s) => s.name === 'Products');
    expect(productsSection).toBeDefined();
    expect(productsSection?.pages).toContain('https://example.com/products');
  });

  it('should generate navigation paths from page links', async () => {
    const fixturePath = path.join(__dirname, '../../fixtures/crawl-results/sample-with-structure.json');
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

    expect(documentation.navigationPaths).toBeDefined();
    expect(documentation.navigationPaths.length).toBeGreaterThan(0);
    
    // Should have paths connecting pages
    const pathWithProducts = documentation.navigationPaths.find((p) =>
      p.pages.includes('https://example.com/products')
    );
    expect(pathWithProducts).toBeDefined();
  });

  it('should update summary with navigation paths count', async () => {
    const fixturePath = path.join(__dirname, '../../fixtures/crawl-results/sample-with-structure.json');
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

    expect(documentation.summary.navigationPathsCount).toBe(documentation.navigationPaths.length);
  });
});

