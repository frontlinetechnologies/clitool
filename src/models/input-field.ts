/**
 * InputField model representing an HTML input element discovered on a page.
 */

export interface InputField {
  type: string;
  name?: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
  pageUrl: string;
  formId?: string;
}

