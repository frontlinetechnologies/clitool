/**
 * Shared parser for crawl results JSON input.
 * Reads JSON from stdin, validates schema, and parses into typed objects.
 * Used by both documentation and test generation modules.
 */

import * as readline from 'readline';
import { CrawlResultsInput } from '../documentation/models';
import { Page } from '../models/page';
import { Form } from '../models/form';
import { Button } from '../models/button';
import { InputField } from '../models/input-field';
import { CrawlSummary } from '../models/crawl-summary';

/**
 * Raw JSON structure for crawl results input.
 */
interface RawCrawlResults {
  summary?: RawCrawlSummary;
  pages?: RawPage[];
  forms?: RawForm[];
  buttons?: RawButton[];
  inputFields?: RawInputField[];
}

interface RawCrawlSummary {
  totalPages?: number;
  totalForms?: number;
  totalButtons?: number;
  totalInputFields?: number;
  errors?: number;
  skipped?: number;
  interrupted?: boolean;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

interface RawPage {
  url: string;
  status: number;
  title?: string;
  discoveredAt: string;
  processedAt?: string;
  links?: string[];
  error?: string;
}

interface RawForm {
  id?: string;
  action: string;
  method: string;
  pageUrl: string;
  inputFields?: RawInputField[];
}

interface RawButton {
  type: string;
  text?: string;
  id?: string;
  className?: string;
  pageUrl: string;
  formId?: string;
}

interface RawInputField {
  type: string;
  name?: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
  pageUrl: string;
  formId?: string;
}

/**
 * Error handler configuration for creating domain-specific errors.
 */
export interface ErrorHandlerConfig {
  createValidationError: (message: string) => Error;
  createParseError: (message: string, cause?: Error) => Error;
  createInvalidInputError: (message: string, cause?: Error) => Error;
  errorName: string;
}

/**
 * Reads all input from stdin as a string.
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const lines: string[] = [];

    rl.on('line', (line) => {
      lines.push(line);
    });

    rl.on('close', () => {
      resolve(lines.join('\n'));
    });

    rl.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Creates a crawl results parser configured with domain-specific error handling.
 *
 * @param errorConfig - Configuration for creating domain-specific errors
 * @returns Function that parses crawl results from stdin
 */
export function createCrawlResultsParser(errorConfig: ErrorHandlerConfig) {
  return async function parseCrawlResults(): Promise<CrawlResultsInput> {
    try {
      const inputText = await readStdin();
      const jsonData = JSON.parse(inputText) as RawCrawlResults;

      // Validate required fields
      if (!jsonData.summary || !jsonData.pages) {
        throw errorConfig.createValidationError(
          'Missing required fields: summary and pages are required',
        );
      }

      // Parse summary
      const rawSummary = jsonData.summary;
      const summary: CrawlSummary = {
        totalPages: rawSummary.totalPages ?? 0,
        totalForms: rawSummary.totalForms ?? 0,
        totalButtons: rawSummary.totalButtons ?? 0,
        totalInputFields: rawSummary.totalInputFields ?? 0,
        errors: rawSummary.errors ?? 0,
        skipped: rawSummary.skipped ?? 0,
        interrupted: rawSummary.interrupted ?? false,
        startTime: rawSummary.startTime ?? '',
        endTime: rawSummary.endTime ?? undefined,
        duration: rawSummary.duration ?? undefined,
      };

      // Parse pages
      const pages: Page[] = (jsonData.pages || []).map((page: RawPage) => ({
        url: page.url,
        status: page.status,
        title: page.title ?? undefined,
        discoveredAt: page.discoveredAt,
        processedAt: page.processedAt ?? undefined,
        links: page.links ?? undefined,
        error: page.error ?? undefined,
      }));

      // Parse optional arrays
      const forms: Form[] = (jsonData.forms || []).map((form: RawForm) => ({
        id: form.id ?? undefined,
        action: form.action,
        method: form.method,
        pageUrl: form.pageUrl,
        inputFields: form.inputFields?.map((field: RawInputField) => ({
          type: field.type,
          name: field.name ?? undefined,
          id: field.id ?? undefined,
          required: field.required ?? undefined,
          placeholder: field.placeholder ?? undefined,
          pageUrl: field.pageUrl,
          formId: field.formId ?? undefined,
        })),
      }));

      const buttons: Button[] = (jsonData.buttons || []).map((button: RawButton) => ({
        type: button.type,
        text: button.text ?? undefined,
        id: button.id ?? undefined,
        className: button.className ?? undefined,
        pageUrl: button.pageUrl,
        formId: button.formId ?? undefined,
      }));

      const inputFields: InputField[] = (jsonData.inputFields || []).map((field: RawInputField) => ({
        type: field.type,
        name: field.name ?? undefined,
        id: field.id ?? undefined,
        required: field.required ?? undefined,
        placeholder: field.placeholder ?? undefined,
        pageUrl: field.pageUrl,
        formId: field.formId ?? undefined,
      }));

      return {
        summary,
        pages,
        forms,
        buttons,
        inputFields,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw errorConfig.createParseError(
          `Invalid JSON: ${error.message}`,
          error,
        );
      }
      if (error instanceof Error && error.name === errorConfig.errorName) {
        throw error;
      }
      throw errorConfig.createInvalidInputError(
        `Failed to parse crawl results: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
      );
    }
  };
}
