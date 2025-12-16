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
 * Pages and detailed element data only included in verbose mode.
 */
export function formatAsJSON(results: CrawlResults, verbose: boolean = false): string {
  const output: CrawlResults = {
    summary: results.summary,
    pages: verbose ? results.pages : [],
    forms: verbose ? results.forms : [],
    buttons: verbose ? results.buttons : [],
    inputFields: verbose ? results.inputFields : [],
  };

  return JSON.stringify(output, null, 2);
}

