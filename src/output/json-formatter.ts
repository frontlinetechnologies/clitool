/**
 * JSON formatter for crawl results.
 * Formats crawl results according to the output schema.
 */

import { Page } from '../models/page';
import { CrawlSummary } from '../models/crawl-summary';
import { Form } from '../models/form';
import { Button } from '../models/button';
import { InputField } from '../models/input-field';

export interface CrawlResults {
  summary: CrawlSummary;
  pages: Page[];
  forms: Form[];
  buttons: Button[];
  inputFields: InputField[];
}

/**
 * Formats crawl results as JSON.
 * Always includes summary and element arrays (can be empty).
 * The verbose flag is reserved for future use to include additional detail fields.
 */
export function formatAsJSON(results: CrawlResults, _verbose: boolean = false): string {
  // Always include arrays - they are required for downstream commands (generate-docs, generate-tests)
  const output: CrawlResults = {
    summary: results.summary,
    pages: results.pages,
    forms: results.forms,
    buttons: results.buttons,
    inputFields: results.inputFields,
  };

  return JSON.stringify(output, null, 2);
}

