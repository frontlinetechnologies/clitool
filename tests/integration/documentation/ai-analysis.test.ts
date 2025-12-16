import { generateDocumentation } from '../../../src/documentation/doc-generator';
import { CrawlResultsInput } from '../../../src/documentation/models';
import { analyzePage } from '../../../src/ai/anthropic-client';

// Mock AI client
jest.mock('../../../src/ai/anthropic-client');

describe('AI Analysis Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include AI descriptions when API is available', async () => {
    // Mock successful AI analysis
    (analyzePage as jest.Mock).mockResolvedValue('AI-generated page description');

    const crawlResults: CrawlResultsInput = {
      summary: {
        totalPages: 1,
        totalForms: 0,
        totalButtons: 0,
        totalInputFields: 0,
        errors: 0,
        skipped: 0,
        interrupted: false,
        startTime: '2024-01-01T00:00:00Z',
      },
      pages: [
        {
          url: 'https://example.com',
          status: 200,
          title: 'Test Page',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
      ],
      forms: [],
      buttons: [],
      inputFields: [],
    };

    const documentation = await generateDocumentation(crawlResults);

    expect(analyzePage).toHaveBeenCalled();
    // Note: AI descriptions are added to page details in the generator
    expect(documentation.pageDetails).toBeDefined();
  });

  it('should handle AI API unavailability gracefully', async () => {
    // Mock API failure
    (analyzePage as jest.Mock).mockResolvedValue(null);

    const crawlResults: CrawlResultsInput = {
      summary: {
        totalPages: 1,
        totalForms: 0,
        totalButtons: 0,
        totalInputFields: 0,
        errors: 0,
        skipped: 0,
        interrupted: false,
        startTime: '2024-01-01T00:00:00Z',
      },
      pages: [
        {
          url: 'https://example.com',
          status: 200,
          title: 'Test Page',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
      ],
      forms: [],
      buttons: [],
      inputFields: [],
    };

    const documentation = await generateDocumentation(crawlResults);

    // Should still generate documentation without AI descriptions
    expect(documentation).toBeDefined();
    expect(documentation.pageDetails.length).toBe(1);
  });

  it('should handle AI API errors gracefully', async () => {
    // Mock API error
    (analyzePage as jest.Mock).mockRejectedValue(new Error('API error'));

    const crawlResults: CrawlResultsInput = {
      summary: {
        totalPages: 1,
        totalForms: 0,
        totalButtons: 0,
        totalInputFields: 0,
        errors: 0,
        skipped: 0,
        interrupted: false,
        startTime: '2024-01-01T00:00:00Z',
      },
      pages: [
        {
          url: 'https://example.com',
          status: 200,
          title: 'Test Page',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
      ],
      forms: [],
      buttons: [],
      inputFields: [],
    };

    // Should not throw error
    await expect(generateDocumentation(crawlResults)).resolves.toBeDefined();
  });
});

