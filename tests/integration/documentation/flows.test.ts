import * as fs from 'fs';
import * as path from 'path';
import { generateDocumentation } from '../../../src/documentation/doc-generator';
import { CrawlResultsInput } from '../../../src/documentation/models';
import { Page } from '../../../src/models/page';
import { CrawlSummary } from '../../../src/models/crawl-summary';

describe('Flow Documentation Integration', () => {
  it('should generate documentation with critical flows', async () => {
    const fixturePath = path.join(__dirname, '../../fixtures/crawl-results/sample-with-flows.json');
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

    expect(documentation.criticalFlows).toBeDefined();
    expect(documentation.criticalFlows.length).toBeGreaterThan(0);
    
    // Should have login flow
    const loginFlow = documentation.criticalFlows.find((f) => f.type === 'login');
    expect(loginFlow).toBeDefined();
    expect(loginFlow?.pages.length).toBeGreaterThan(0);
  });

  it('should detect checkout flow from payment fields', async () => {
    const fixturePath = path.join(__dirname, '../../fixtures/crawl-results/sample-with-flows.json');
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

    const checkoutFlow = documentation.criticalFlows.find((f) => f.type === 'checkout');
    expect(checkoutFlow).toBeDefined();
    expect(checkoutFlow?.pages.some((p) => p.url.includes('checkout'))).toBe(true);
  });

  it('should update summary with critical flows count', async () => {
    const fixturePath = path.join(__dirname, '../../fixtures/crawl-results/sample-with-flows.json');
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

    expect(documentation.summary.criticalFlowsCount).toBe(documentation.criticalFlows.length);
  });
});

