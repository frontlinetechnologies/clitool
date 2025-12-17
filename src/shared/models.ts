/**
 * Shared models used across documentation and test generation modules.
 */

import { Page } from '../models/page';
import { Form } from '../models/form';
import { Button } from '../models/button';
import { InputField } from '../models/input-field';
import { CrawlSummary } from '../models/crawl-summary';

/**
 * Input structure for crawl results parser.
 * Used by both documentation and test generation modules.
 */
export interface CrawlResultsInput {
  summary: CrawlSummary;
  pages: Page[];
  forms?: Form[];
  buttons?: Button[];
  inputFields?: InputField[];
}
