/**
 * HTML parser for extracting forms, buttons, and input fields from HTML content.
 * Uses Cheerio to parse HTML and extract interactive elements.
 */

import * as cheerio from 'cheerio';
import { Form } from '../models/form';
import { Button } from '../models/button';
import { InputField } from '../models/input-field';

export interface ParsedElements {
  forms: Form[];
  buttons: Button[];
  inputFields: InputField[];
}

/**
 * Parses HTML content and extracts forms, buttons, and input fields.
 * @param html - HTML content to parse
 * @param pageUrl - URL of the page being parsed
 * @returns Parsed elements
 */
export function parseHTML(html: string, pageUrl: string): ParsedElements {
  const $ = cheerio.load(html);
  const forms: Form[] = [];
  const buttons: Button[] = [];
  const inputFields: InputField[] = [];

  // Extract forms
  $('form').each((_, element) => {
    const $form = $(element);
    const formId = $form.attr('id') || undefined;
    const action = $form.attr('action') || pageUrl;
    const method = ($form.attr('method') || 'GET').toUpperCase();

    // Resolve relative action URLs
    let actionURL = action;
    try {
      actionURL = new URL(action, pageUrl).toString();
    } catch {
      // Invalid URL, use page URL
      actionURL = pageUrl;
    }

    const form: Form = {
      id: formId,
      action: actionURL,
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      pageUrl,
      inputFields: [],
    };

    // Extract input fields within this form
    $form.find('input, textarea, select').each((_, inputElement) => {
      const $input = $(inputElement);
      const tagName = inputElement.tagName.toLowerCase();
      const type = tagName === 'textarea' ? 'textarea' : tagName === 'select' ? 'select' : ($input.attr('type') || 'text').toLowerCase();

      const inputField: InputField = {
        type,
        name: $input.attr('name') || undefined,
        id: $input.attr('id') || undefined,
        required: $input.attr('required') !== undefined,
        placeholder: $input.attr('placeholder') || undefined,
        pageUrl,
        formId: formId,
      };

      form.inputFields = form.inputFields || [];
      form.inputFields.push(inputField);
      inputFields.push(inputField);
    });

    forms.push(form);
  });

  // Extract standalone buttons (not in forms)
  $('button, input[type="button"], input[type="submit"], input[type="reset"]').each((_, element) => {
    const $button = $(element);
    const tagName = element.tagName.toLowerCase();
    let type: string;

    if (tagName === 'button') {
      type = ($button.attr('type') || 'button').toLowerCase();
    } else {
      type = ($button.attr('type') || 'button').toLowerCase();
    }

    // Check if button is inside a form
    const $form = $button.closest('form');
    const formId = $form.length > 0 ? ($form.attr('id') || undefined) : undefined;

    const button: Button = {
      type: type as 'button' | 'submit' | 'reset',
      text: $button.text().trim() || $button.attr('value') || undefined,
      id: $button.attr('id') || undefined,
      className: $button.attr('class') || undefined,
      pageUrl,
      formId,
    };

    buttons.push(button);
  });

  // Extract standalone input fields (not in forms)
  $('input, textarea, select').each((_, element) => {
    const $input = $(element);
    const $form = $input.closest('form');

    // Skip if already processed as part of a form
    if ($form.length > 0) {
      return;
    }

    const tagName = element.tagName.toLowerCase();
    const type = tagName === 'textarea' ? 'textarea' : tagName === 'select' ? 'select' : ($input.attr('type') || 'text').toLowerCase();

    const inputField: InputField = {
      type,
      name: $input.attr('name') || undefined,
      id: $input.attr('id') || undefined,
      required: $input.attr('required') !== undefined,
      placeholder: $input.attr('placeholder') || undefined,
      pageUrl,
    };

    inputFields.push(inputField);
  });

  return {
    forms,
    buttons,
    inputFields,
  };
}

