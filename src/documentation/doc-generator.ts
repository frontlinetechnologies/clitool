/**
 * Main documentation generator that orchestrates parsing, generation, and formatting.
 * Handles empty results by generating minimal documentation with explanatory message.
 */

import { CrawlResultsInput } from './models';
import { Documentation, DocumentationSummary, SiteStructure, PageDetail } from './models';
import { analyzeSiteStructure, extractNavigationPaths } from './structure-analyzer';
import { detectCriticalFlows } from './flow-detector';
import { analyzePage } from '../ai/anthropic-client';

/**
 * Generates documentation from crawl results.
 * Handles empty results per FR-015 by generating minimal documentation with message.
 *
 * @param crawlResults - Parsed crawl results input
 * @param apiKey - Optional API key for AI features. If provided, takes precedence over environment variable.
 * @param userContext - Optional user-provided context to include in AI prompts
 * @returns Generated documentation object
 */
export async function generateDocumentation(crawlResults: CrawlResultsInput, apiKey?: string, userContext?: string): Promise<Documentation> {
  // Handle empty results
  if (!crawlResults.pages || crawlResults.pages.length === 0) {
    return generateEmptyDocumentation();
  }

  // Generate summary
  const summary = generateSummary(crawlResults);

  // Analyze site structure (US2)
  const siteStructure = analyzeSiteStructure(crawlResults.pages);

  // Extract navigation paths (US2)
  const navigationPaths = extractNavigationPaths(crawlResults.pages);

  // Detect critical flows (US3)
  const criticalFlows = detectCriticalFlows(crawlResults.pages, crawlResults.forms || []);

  // Generate page details with AI descriptions (Phase 6)
  const pageDetails = await generatePageDetailsWithAI(crawlResults, apiKey, userContext);

  // Update summary with navigation paths and flows count
  summary.navigationPathsCount = navigationPaths.length;
  summary.criticalFlowsCount = criticalFlows.length;

  // Build documentation
  const documentation: Documentation = {
    title: 'Site Documentation',
    summary,
    siteStructure,
    navigationPaths,
    criticalFlows,
    pageDetails,
    generatedAt: new Date().toISOString(),
  };

  return documentation;
}

/**
 * Generates minimal documentation for empty crawl results.
 */
function generateEmptyDocumentation(): Documentation {
  const summary: DocumentationSummary = {
    totalPages: 0,
    totalForms: 0,
    totalButtons: 0,
    totalInputFields: 0,
    criticalFlowsCount: 0,
    navigationPathsCount: 0,
  };

  const siteStructure: SiteStructure = {
    homePage: '',
    sections: [],
    hierarchy: { url: '' },
  };

  return {
    title: 'Site Documentation',
    summary,
    siteStructure,
    navigationPaths: [],
    criticalFlows: [],
    pageDetails: [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates summary statistics from crawl results.
 */
function generateSummary(crawlResults: CrawlResultsInput): DocumentationSummary {
  return {
    totalPages: crawlResults.pages?.length || 0,
    totalForms: crawlResults.summary.totalForms,
    totalButtons: crawlResults.summary.totalButtons,
    totalInputFields: crawlResults.summary.totalInputFields,
    criticalFlowsCount: 0, // Will be populated below
    navigationPathsCount: 0, // Will be populated below
  };
}


/**
 * Generates page details from crawl results with AI descriptions.
 * Per FR-007: uses Anthropic API for page analysis.
 * Per FR-008: falls back to structural descriptions if API unavailable.
 * Per FR-009: handles API unavailability gracefully.
 * Per FR-018: processes sequentially to respect API rate limits.
 *
 * @param crawlResults - Parsed crawl results input
 * @param apiKey - Optional API key for AI features. If provided, takes precedence over environment variable.
 * @param userContext - Optional user-provided context to include in AI prompts
 */
async function generatePageDetailsWithAI(crawlResults: CrawlResultsInput, apiKey?: string, userContext?: string): Promise<PageDetail[]> {
  const pageDetails: PageDetail[] = [];

  // Process pages sequentially to respect API rate limits (FR-018)
  for (const page of crawlResults.pages) {
    // Find forms for this page
    const pageForms = (crawlResults.forms || []).filter((f) => f.pageUrl === page.url);
    const forms = pageForms.map((form) => ({
      id: form.id,
      action: form.action,
      method: form.method,
      inputCount: form.inputFields?.length || 0,
    }));

    // Find buttons for this page
    const pageButtons = (crawlResults.buttons || []).filter((b) => b.pageUrl === page.url);
    const buttons = pageButtons.map((button) => ({
      id: button.id,
      type: button.type,
      text: button.text,
    }));

    // Find input fields for this page
    const pageInputFields = (crawlResults.inputFields || []).filter((f) => f.pageUrl === page.url);
    const inputFields = pageInputFields.map((field) => ({
      id: field.id,
      type: field.type,
      name: field.name,
      required: field.required,
    }));

    // Try to get AI-generated description (FR-007, FR-008, FR-009)
    let description: string | undefined;
    try {
      const aiDescription = await analyzePage(page.url, page.title, undefined, apiKey, undefined, userContext);
      if (aiDescription) {
        description = aiDescription;
      } else {
        // Fallback to structural description (FR-008)
        description = generateStructuralDescription(page, forms, buttons, inputFields);
      }
    } catch (error) {
      // Handle API errors gracefully (FR-009)
      description = generateStructuralDescription(page, forms, buttons, inputFields);
    }

    pageDetails.push({
      url: page.url,
      title: page.title,
      description,
      forms: forms.length > 0 ? forms : undefined,
      buttons: buttons.length > 0 ? buttons : undefined,
      inputFields: inputFields.length > 0 ? inputFields : undefined,
      links: page.links,
    });
  }

  return pageDetails;
}

/**
 * Generates a structural description when AI is unavailable.
 * Per FR-008: provides fallback description based on page structure.
 */
function generateStructuralDescription(
  page: { url: string; title?: string },
  forms: Array<{ action: string; method: string; inputCount: number }>,
  buttons: Array<{ type: string; text?: string }>,
  inputFields: Array<{ type: string; name?: string }>,
): string {
  const parts: string[] = [];

  if (page.title) {
    parts.push(`Page titled "${page.title}"`);
  } else {
    parts.push('Page');
  }

  if (forms.length > 0) {
    parts.push(`with ${forms.length} form${forms.length > 1 ? 's' : ''}`);
  }

  if (inputFields.length > 0) {
    parts.push(`containing ${inputFields.length} input field${inputFields.length > 1 ? 's' : ''}`);
  }

  if (buttons.length > 0) {
    parts.push(`and ${buttons.length} button${buttons.length > 1 ? 's' : ''}`);
  }

  return parts.join(' ') + '.';
}

