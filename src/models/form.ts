/**
 * Form model representing an HTML form element discovered on a page.
 */

import { InputField } from './input-field';

export interface Form {
  id?: string;
  action: string;
  method: string;
  pageUrl: string;
  inputFields?: InputField[];
}

