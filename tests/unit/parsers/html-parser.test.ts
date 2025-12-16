import { parseHTML } from '../../../src/parsers/html-parser';

describe('HTML Parser', () => {
  const baseURL = 'https://example.com';

  it('should extract forms with action and method', () => {
    const html = `
      <html>
        <body>
          <form id="login-form" action="/login" method="POST">
            <input type="text" name="username" />
            <input type="password" name="password" />
            <button type="submit">Login</button>
          </form>
        </body>
      </html>
    `;

    const result = parseHTML(html, baseURL);

    expect(result.forms).toHaveLength(1);
    expect(result.forms[0].id).toBe('login-form');
    expect(result.forms[0].action).toContain('/login');
    expect(result.forms[0].method).toBe('POST');
    expect(result.forms[0].inputFields).toHaveLength(2);
  });

  it('should extract buttons', () => {
    const html = `
      <html>
        <body>
          <button type="button" id="btn1">Click me</button>
          <button type="submit">Submit</button>
          <input type="button" value="Input Button" />
        </body>
      </html>
    `;

    const result = parseHTML(html, baseURL);

    expect(result.buttons).toHaveLength(3);
    expect(result.buttons[0].type).toBe('button');
    expect(result.buttons[0].text).toBe('Click me');
    expect(result.buttons[1].type).toBe('submit');
  });

  it('should extract input fields', () => {
    const html = `
      <html>
        <body>
          <input type="text" name="email" placeholder="Enter email" required />
          <input type="password" name="password" />
          <textarea name="message"></textarea>
        </body>
      </html>
    `;

    const result = parseHTML(html, baseURL);

    expect(result.inputFields.length).toBeGreaterThanOrEqual(3);
    const emailInput = result.inputFields.find((input) => input.name === 'email');
    expect(emailInput?.type).toBe('text');
    expect(emailInput?.required).toBe(true);
    expect(emailInput?.placeholder).toBe('Enter email');
  });

  it('should associate input fields with forms', () => {
    const html = `
      <html>
        <body>
          <form id="contact-form">
            <input type="text" name="name" />
            <input type="email" name="email" />
          </form>
        </body>
      </html>
    `;

    const result = parseHTML(html, baseURL);

    expect(result.forms[0].inputFields).toHaveLength(2);
    expect(result.forms[0].inputFields?.[0].formId).toBe('contact-form');
  });

  it('should handle forms without action attribute', () => {
    const html = '<form method="GET"><input type="text" name="q" /></form>';

    const result = parseHTML(html, baseURL);

    expect(result.forms).toHaveLength(1);
    expect(result.forms[0].action).toBe(baseURL);
    expect(result.forms[0].method).toBe('GET');
  });
});

