/**
 * Anthropic API client wrapper for page analysis.
 * Handles API initialization, error handling, and provides graceful fallback behavior.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  initializePromptLoader,
  loadAndRenderPrompt,
  isPromptError,
} from '../prompts';

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

let client: Anthropic | null = null;

/**
 * Resets the client (for testing purposes).
 */
export function resetClient(): void {
  client = null;
}

/**
 * Initializes the Anthropic API client with API key from parameter or environment variable.
 * Returns null if API key is not available or initialization fails.
 * 
 * @param apiKey - Optional API key. If provided, takes precedence over environment variable.
 */
export function initializeClient(apiKey?: string): Anthropic | null {
  if (client !== null && !apiKey) {
    return client;
  }

  const keyToUse = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!keyToUse) {
    return null;
  }

  try {
    // If apiKey parameter is provided, create a new client instance
    // Otherwise, reuse cached client if available
    if (apiKey) {
      return new Anthropic({
        apiKey: keyToUse,
      });
    }
    
    if (client === null) {
      client = new Anthropic({
        apiKey: keyToUse,
      });
    }
    return client;
  } catch (error) {
    // Gracefully handle initialization errors
    return null;
  }
}

/**
 * Analyzes a page and generates a human-readable description using Anthropic API.
 * Returns null if API is unavailable or request fails.
 *
 * @param pageUrl - URL of the page to analyze
 * @param pageTitle - Title of the page (optional)
 * @param pageContent - HTML content or text content of the page (optional)
 * @param apiKey - Optional API key. If provided, takes precedence over environment variable.
 * @param verbose - Whether to enable verbose logging
 * @returns Promise resolving to description string or null on failure
 */
export async function analyzePage(
  pageUrl: string,
  pageTitle?: string,
  pageContent?: string,
  apiKey?: string,
  verbose?: boolean,
): Promise<string | null> {
  const apiClient = initializeClient(apiKey);
  if (!apiClient) {
    return null;
  }

  try {
    // Initialize prompt loader
    initializePromptLoader({ verbose });

    // Load and render prompt from external file
    const { renderedContent, maxTokens } = await loadAndRenderPrompt('page-analysis', {
      variables: {
        url: pageUrl,
        title: pageTitle,
        content: pageContent
          ? pageContent.length > 2000
            ? pageContent.substring(0, 2000) + '...'
            : pageContent
          : undefined,
      },
      verbose,
    });

    const response = await apiClient.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: renderedContent,
        },
      ],
    });

    // Extract text from response
    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    return null;
  } catch (error) {
    // Log prompt errors for debugging
    if (isPromptError(error)) {
      if (verbose) {
        console.error(`Prompt error: ${error.message}`);
        if (error.suggestions.length > 0) {
          console.error(`Suggestions: ${error.suggestions.join(', ')}`);
        }
      }
    }
    // Gracefully handle API errors - return null to trigger fallback
    return null;
  }
}


/**
 * Locator types supported by Playwright (in priority order).
 */
export type AILocatorType = 'role' | 'label' | 'placeholder' | 'text' | 'testid' | 'name' | 'css';

/**
 * Structured step from AI response.
 */
export interface AITestStep {
  action: 'goto' | 'fill' | 'click' | 'wait' | 'select';
  target?: string; // URL for goto action
  locatorType?: AILocatorType;
  locatorValue?: string;
  options?: Record<string, string>; // e.g., { name: 'Submit' } for role locator
  value?: string; // Value for fill/select actions
}

/**
 * Structured assertion from AI response.
 */
export interface AITestAssertion {
  type: 'url' | 'title' | 'visible' | 'hidden' | 'text' | 'value' | 'enabled' | 'disabled';
  expected?: string; // Expected value for url, title, text assertions
  locatorType?: AILocatorType;
  locatorValue?: string;
  description?: string; // Human-readable description
}

/**
 * Interface for AI-generated test scenario suggestions.
 * Supports both legacy string arrays and new structured format.
 */
export interface AITestScenarioSuggestion {
  name: string;
  description: string;
  steps: AITestStep[] | string[]; // New structured format or legacy strings
  assertions: AITestAssertion[] | string[]; // New structured format or legacy strings
}

/**
 * Analyzes a flow and generates AI-enhanced test scenarios.
 * Returns null if API is unavailable or request fails, triggering fallback to pattern-based generation.
 *
 * @param flowType - Type of flow (login, checkout, form-submission)
 * @param flowPages - Array of page URLs in the flow
 * @param formFields - Description of form fields
 * @param apiKey - Optional API key. If provided, takes precedence over environment variable.
 * @param verbose - Whether to enable verbose logging
 * @returns Promise resolving to test scenario suggestions or null on failure
 */
export async function analyzeFlowForTests(
  flowType: string,
  flowPages: string[],
  formFields: string[],
  apiKey?: string,
  verbose?: boolean,
): Promise<AITestScenarioSuggestion[] | null> {
  const apiClient = initializeClient(apiKey);
  if (!apiClient) {
    return null;
  }

  try {
    // Initialize prompt loader
    initializePromptLoader({ verbose });

    // Load and render prompt from external file
    const { renderedContent, maxTokens } = await loadAndRenderPrompt('test-scenario-generation', {
      variables: {
        flow_type: flowType,
        pages: flowPages.join(' -> '),
        form_fields: formFields.join(', '),
      },
      verbose,
    });

    const response = await apiClient.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: renderedContent,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return parseTestSuggestions(content.text);
    }

    return null;
  } catch (error) {
    // Log prompt errors for debugging
    if (isPromptError(error)) {
      if (verbose) {
        console.error(`Prompt error: ${error.message}`);
        if (error.suggestions.length > 0) {
          console.error(`Suggestions: ${error.suggestions.join(', ')}`);
        }
      }
    }
    // Gracefully handle API errors - return null to trigger fallback
    return null;
  }
}


/**
 * Raw parsed item from AI JSON response.
 */
interface RawTestSuggestion {
  name?: string;
  description?: string;
  steps?: unknown[];
  assertions?: unknown[];
}

/**
 * Raw step from AI JSON response.
 */
interface RawTestStep {
  action?: string;
  target?: string;
  locatorType?: string;
  locatorValue?: string;
  options?: Record<string, string>;
  value?: string;
}

/**
 * Raw assertion from AI JSON response.
 */
interface RawTestAssertion {
  type?: string;
  expected?: string;
  locatorType?: string;
  locatorValue?: string;
  description?: string;
}

/**
 * Parses AI response into test scenario suggestions.
 * Handles both new structured format and legacy string arrays.
 */
function parseTestSuggestions(response: string): AITestScenarioSuggestion[] | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed: unknown = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((item: unknown) => {
          const suggestion = item as RawTestSuggestion;
          return {
            name: suggestion.name || 'AI Suggested Test',
            description: suggestion.description || '',
            steps: parseSteps(suggestion.steps),
            assertions: parseAssertions(suggestion.assertions),
          };
        });
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parses steps from AI response, handling both structured and legacy formats.
 */
function parseSteps(steps: unknown[] | undefined): AITestStep[] | string[] {
  if (!Array.isArray(steps)) {
    return [];
  }

  // Check if it's structured format (objects with action property)
  const firstStep = steps[0] as RawTestStep | string | undefined;
  if (steps.length > 0 && typeof firstStep === 'object' && firstStep !== null && 'action' in firstStep) {
    return steps.map((step: unknown) => {
      const s = step as RawTestStep;
      return {
        action: (s.action as AITestStep['action']) || 'wait',
        target: s.target,
        locatorType: s.locatorType as AILocatorType | undefined,
        locatorValue: s.locatorValue,
        options: s.options,
        value: s.value,
      };
    });
  }

  // Legacy format: array of strings
  return steps.filter((s: unknown): s is string => typeof s === 'string');
}

/**
 * Parses assertions from AI response, handling both structured and legacy formats.
 */
function parseAssertions(assertions: unknown[] | undefined): AITestAssertion[] | string[] {
  if (!Array.isArray(assertions)) {
    return [];
  }

  // Check if it's structured format (objects with type property)
  const firstAssertion = assertions[0] as RawTestAssertion | string | undefined;
  if (assertions.length > 0 && typeof firstAssertion === 'object' && firstAssertion !== null && 'type' in firstAssertion) {
    return assertions.map((assertion: unknown) => {
      const a = assertion as RawTestAssertion;
      return {
        type: (a.type as AITestAssertion['type']) || 'visible',
        expected: a.expected,
        locatorType: a.locatorType as AILocatorType | undefined,
        locatorValue: a.locatorValue,
        description: a.description,
      };
    });
  }

  // Legacy format: array of strings
  return assertions.filter((a: unknown): a is string => typeof a === 'string');
}

/**
 * Generates AI-enhanced test data for a specific field type and context.
 * Returns null if API is unavailable, triggering fallback to pattern-based generation.
 *
 * @param fieldType - Type of the field (email, password, text, etc.)
 * @param context - Additional context about the field (name, placeholder, etc.)
 * @param apiKey - Optional API key. If provided, takes precedence over environment variable.
 * @param verbose - Whether to enable verbose logging
 * @returns Promise resolving to enhanced test data or null on failure
 */
export async function generateEnhancedTestData(
  fieldType: string,
  context: string,
  apiKey?: string,
  verbose?: boolean,
): Promise<string | null> {
  const apiClient = initializeClient(apiKey);
  if (!apiClient) {
    return null;
  }

  try {
    // Initialize prompt loader
    initializePromptLoader({ verbose });

    // Load and render prompt from external file
    const { renderedContent, maxTokens } = await loadAndRenderPrompt('test-data-generation', {
      variables: {
        field_type: fieldType,
        context: context,
      },
      verbose,
    });

    const response = await apiClient.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: renderedContent,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    return null;
  } catch (error) {
    // Log prompt errors for debugging
    if (isPromptError(error)) {
      if (verbose) {
        console.error(`Prompt error: ${error.message}`);
        if (error.suggestions.length > 0) {
          console.error(`Suggestions: ${error.suggestions.join(', ')}`);
        }
      }
    }
    return null;
  }
}

/**
 * Checks if the AI client is available.
 * Useful for determining whether to attempt AI enhancement.
 * 
 * @param apiKey - Optional API key. If provided, takes precedence over environment variable.
 */
export function isAIAvailable(apiKey?: string): boolean {
  return initializeClient(apiKey) !== null;
}

