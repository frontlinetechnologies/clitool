/**
 * Button model representing an interactive button element discovered on a page.
 */

export interface Button {
  type: string;
  text?: string;
  id?: string;
  className?: string;
  pageUrl: string;
  formId?: string;
}

