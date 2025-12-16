import { formatAsMarkdown } from '../../../src/documentation/markdown-formatter';
import { Documentation, DocumentationSummary, SiteStructure, NavigationPath, UserFlow, PageDetail } from '../../../src/documentation/models';

describe('Markdown Formatter', () => {
  it('should format basic documentation with summary', () => {
    const summary: DocumentationSummary = {
      totalPages: 5,
      totalForms: 2,
      totalButtons: 8,
      totalInputFields: 10,
      criticalFlowsCount: 1,
      navigationPathsCount: 3,
    };

    const siteStructure: SiteStructure = {
      homePage: 'https://example.com',
      sections: [],
      hierarchy: {
        url: 'https://example.com',
        title: 'Home',
      },
    };

    const doc: Documentation = {
      title: 'Site Documentation',
      summary,
      siteStructure,
      navigationPaths: [],
      criticalFlows: [],
      pageDetails: [],
      generatedAt: '2024-01-01T00:00:00Z',
    };

    const output = formatAsMarkdown(doc);

    expect(output).toContain('# Site Documentation');
    expect(output).toContain('## Summary');
    expect(output).toContain('Total Pages: 5');
    expect(output).toContain('Total Forms: 2');
    expect(output).toContain('Total Buttons: 8');
    expect(output).toContain('Total Input Fields: 10');
  });

  it('should format site structure with sections', () => {
    const summary: DocumentationSummary = {
      totalPages: 3,
      totalForms: 0,
      totalButtons: 0,
      totalInputFields: 0,
      criticalFlowsCount: 0,
      navigationPathsCount: 0,
    };

    const siteStructure: SiteStructure = {
      homePage: 'https://example.com',
      sections: [
        {
          name: 'About',
          urlPrefix: '/about/',
          pages: ['https://example.com/about'],
          depth: 1,
        },
      ],
      hierarchy: {
        url: 'https://example.com',
        title: 'Home',
        children: [
          {
            url: 'https://example.com/about',
            title: 'About',
          },
        ],
      },
    };

    const doc: Documentation = {
      title: 'Site Documentation',
      summary,
      siteStructure,
      navigationPaths: [],
      criticalFlows: [],
      pageDetails: [],
      generatedAt: '2024-01-01T00:00:00Z',
    };

    const output = formatAsMarkdown(doc);

    expect(output).toContain('## Site Structure');
    expect(output).toContain('### About');
    expect(output).toContain('https://example.com/about');
  });

  it('should format navigation paths', () => {
    const summary: DocumentationSummary = {
      totalPages: 3,
      totalForms: 0,
      totalButtons: 0,
      totalInputFields: 0,
      criticalFlowsCount: 0,
      navigationPathsCount: 1,
    };

    const navigationPaths: NavigationPath[] = [
      {
        id: 'path-1',
        pages: ['https://example.com', 'https://example.com/about', 'https://example.com/contact'],
        description: 'Main navigation flow',
      },
    ];

    const doc: Documentation = {
      title: 'Site Documentation',
      summary,
      siteStructure: {
        homePage: 'https://example.com',
        sections: [],
        hierarchy: { url: 'https://example.com' },
      },
      navigationPaths,
      criticalFlows: [],
      pageDetails: [],
      generatedAt: '2024-01-01T00:00:00Z',
    };

    const output = formatAsMarkdown(doc);

    expect(output).toContain('## Navigation Paths');
    expect(output).toContain('https://example.com');
    expect(output).toContain('https://example.com/about');
    expect(output).toContain('Main navigation flow');
  });

  it('should format critical user flows', () => {
    const summary: DocumentationSummary = {
      totalPages: 2,
      totalForms: 1,
      totalButtons: 1,
      totalInputFields: 2,
      criticalFlowsCount: 1,
      navigationPathsCount: 0,
    };

    const criticalFlows: UserFlow[] = [
      {
        type: 'login',
        name: 'Login Flow',
        pages: [
          {
            url: 'https://example.com/login',
            step: 1,
            role: 'entry',
          },
          {
            url: 'https://example.com/dashboard',
            step: 2,
            role: 'confirmation',
          },
        ],
        description: 'User login process',
      },
    ];

    const doc: Documentation = {
      title: 'Site Documentation',
      summary,
      siteStructure: {
        homePage: 'https://example.com',
        sections: [],
        hierarchy: { url: 'https://example.com' },
      },
      navigationPaths: [],
      criticalFlows,
      pageDetails: [],
      generatedAt: '2024-01-01T00:00:00Z',
    };

    const output = formatAsMarkdown(doc);

    expect(output).toContain('## Critical User Flows');
    expect(output).toContain('### Login Flow');
    expect(output).toContain('https://example.com/login');
    expect(output).toContain('User login process');
  });

  it('should format page details', () => {
    const summary: DocumentationSummary = {
      totalPages: 1,
      totalForms: 1,
      totalButtons: 2,
      totalInputFields: 3,
      criticalFlowsCount: 0,
      navigationPathsCount: 0,
    };

    const pageDetails: PageDetail[] = [
      {
        url: 'https://example.com',
        title: 'Home Page',
        description: 'Main landing page',
        forms: [
          {
            action: '/search',
            method: 'GET',
            inputCount: 1,
          },
        ],
        buttons: [
          {
            type: 'submit',
            text: 'Search',
          },
        ],
        inputFields: [
          {
            type: 'text',
            name: 'query',
            required: true,
          },
        ],
      },
    ];

    const doc: Documentation = {
      title: 'Site Documentation',
      summary,
      siteStructure: {
        homePage: 'https://example.com',
        sections: [],
        hierarchy: { url: 'https://example.com' },
      },
      navigationPaths: [],
      criticalFlows: [],
      pageDetails,
      generatedAt: '2024-01-01T00:00:00Z',
    };

    const output = formatAsMarkdown(doc);

    expect(output).toContain('## Page Details');
    expect(output).toContain('### https://example.com');
    expect(output).toContain('Home Page');
    expect(output).toContain('Main landing page');
  });

  it('should handle empty results gracefully', () => {
    const summary: DocumentationSummary = {
      totalPages: 0,
      totalForms: 0,
      totalButtons: 0,
      totalInputFields: 0,
      criticalFlowsCount: 0,
      navigationPathsCount: 0,
    };

    const doc: Documentation = {
      title: 'Site Documentation',
      summary,
      siteStructure: {
        homePage: '',
        sections: [],
        hierarchy: { url: '' },
      },
      navigationPaths: [],
      criticalFlows: [],
      pageDetails: [],
      generatedAt: '2024-01-01T00:00:00Z',
    };

    const output = formatAsMarkdown(doc);

    expect(output).toContain('# Site Documentation');
    expect(output).toContain('Total Pages: 0');
  });
});

