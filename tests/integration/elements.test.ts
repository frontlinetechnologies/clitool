import { parseHTML } from '../../src/parsers/html-parser';

describe('Element Extraction Integration', () => {
  it('should extract all element types from sample HTML', () => {
    const html = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <form id="search" action="/search" method="GET">
            <input type="text" name="q" placeholder="Search..." />
            <button type="submit">Search</button>
          </form>
          <button type="button" id="help-btn">Help</button>
          <input type="email" name="newsletter" placeholder="Email" />
        </body>
      </html>
    `;

    const result = parseHTML(html, 'https://example.com');

    expect(result.forms.length).toBeGreaterThan(0);
    expect(result.buttons.length).toBeGreaterThan(0);
    expect(result.inputFields.length).toBeGreaterThan(0);
  });
});

