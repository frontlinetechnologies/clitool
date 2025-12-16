/**
 * Parser for crawl results JSON input.
 * Reads JSON from stdin, validates schema, and parses into typed objects.
 */

import * as readline from 'readline';
import { CrawlResultsInput } from './models';
import { Page } from '../models/page';
import { Form } from '../models/form';
import { Button } from '../models/button';
import { InputField } from '../models/input-field';
import { CrawlSummary } from '../models/crawl-summary';
import { createDocumentationError, DocumentationErrorType } from './errors';

/**
 * Reads crawl results JSON from stdin and parses into typed objects.
 * Validates that required fields are present and match expected schema.
 *
 * @returns Promise resolving to parsed crawl results
 * @throws DocumentationError if input is invalid or cannot be parsed
 */
export async function parseCrawlResults(): Promise<CrawlResultsInput> {
  try {
    const inputText = await readStdin();
    const jsonData = JSON.parse(inputText);

    // Validate required fields
    if (!jsonData.summary || !jsonData.pages) {
      throw createDocumentationError(
        DocumentationErrorType.VALIDATION_ERROR,
        'Missing required fields: summary and pages are required',
      );
    }

    // Parse summary
    const summary: CrawlSummary = {
      totalPages: jsonData.summary.totalPages ?? 0,
      totalForms: jsonData.summary.totalForms ?? 0,
      totalButtons: jsonData.summary.totalButtons ?? 0,
      totalInputFields: jsonData.summary.totalInputFields ?? 0,
      errors: jsonData.summary.errors ?? 0,
      skipped: jsonData.summary.skipped ?? 0,
      interrupted: jsonData.summary.interrupted ?? false,
      startTime: jsonData.summary.startTime,
      endTime: jsonData.summary.endTime ?? undefined,
      duration: jsonData.summary.duration ?? undefined,
    };

    // Parse pages
    const pages: Page[] = (jsonData.pages || []).map((page: any) => ({
      url: page.url,
      status: page.status,
      title: page.title ?? undefined,
      discoveredAt: page.discoveredAt,
      processedAt: page.processedAt ?? undefined,
      links: page.links ?? undefined,
      error: page.error ?? undefined,
    }));

    // Parse optional arrays
    const forms: Form[] = (jsonData.forms || []).map((form: any) => ({
      id: form.id ?? undefined,
      action: form.action,
      method: form.method,
      pageUrl: form.pageUrl,
      inputFields: form.inputFields?.map((field: any) => ({
        type: field.type,
        name: field.name ?? undefined,
        id: field.id ?? undefined,
        required: field.required ?? undefined,
        placeholder: field.placeholder ?? undefined,
        pageUrl: field.pageUrl,
        formId: field.formId ?? undefined,
      })),
    }));

    const buttons: Button[] = (jsonData.buttons || []).map((button: any) => ({
      type: button.type,
      text: button.text ?? undefined,
      id: button.id ?? undefined,
      className: button.className ?? undefined,
      pageUrl: button.pageUrl,
      formId: button.formId ?? undefined,
    }));

    const inputFields: InputField[] = (jsonData.inputFields || []).map((field: any) => ({
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
      throw createDocumentationError(
        DocumentationErrorType.PARSE_ERROR,
        `Invalid JSON: ${error.message}`,
        error,
      );
    }
    if (error instanceof Error && error.name === 'DocumentationError') {
      throw error;
    }
    throw createDocumentationError(
      DocumentationErrorType.INVALID_INPUT,
      `Failed to parse crawl results: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined,
    );
  }
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

