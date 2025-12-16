/**
 * Anthropic API client wrapper for page analysis.
 * Handles API initialization, error handling, and provides graceful fallback behavior.
 */

import Anthropic from '@anthropic-ai/sdk';

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
 * @returns Promise resolving to description string or null on failure
 */
export async function analyzePage(
  pageUrl: string,
  pageTitle?: string,
  pageContent?: string,
  apiKey?: string,
): Promise<string | null> {
  const apiClient = initializeClient(apiKey);
  if (!apiClient) {
    return null;
  }

  try {
    // Build prompt for page analysis
    const prompt = buildAnalysisPrompt(pageUrl, pageTitle, pageContent);

    const response = await apiClient.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
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
    // Gracefully handle API errors - return null to trigger fallback
    return null;
  }
}

/**
 * Builds the analysis prompt for Anthropic API.
 */
function buildAnalysisPrompt(pageUrl: string, pageTitle?: string, pageContent?: string): string {
  let prompt = `Analyze this web page and provide a brief, human-readable description (2-3 sentences) of what this page is about and its primary purpose.\n\n`;
  prompt += `URL: ${pageUrl}\n`;

  if (pageTitle) {
    prompt += `Title: ${pageTitle}\n`;
  }

  if (pageContent) {
    // Limit content length to avoid token limits
    const contentPreview = pageContent.length > 2000 ? pageContent.substring(0, 2000) + '...' : pageContent;
    prompt += `\nContent preview:\n${contentPreview}`;
  }

  prompt += `\n\nProvide a concise description focusing on the page's purpose and main functionality.`;

  return prompt;
}

/**
 * Interface for AI-generated test scenario suggestions.
 */
export interface AITestScenarioSuggestion {
  name: string;
  description: string;
  steps: string[];
  assertions: string[];
}

/**
 * Analyzes a flow and generates AI-enhanced test scenarios.
 * Returns null if API is unavailable or request fails, triggering fallback to pattern-based generation.
 *
 * @param flowType - Type of flow (login, checkout, form-submission)
 * @param flowPages - Array of page URLs in the flow
 * @param formFields - Description of form fields
 * @param apiKey - Optional API key. If provided, takes precedence over environment variable.
 * @returns Promise resolving to test scenario suggestions or null on failure
 */
export async function analyzeFlowForTests(
  flowType: string,
  flowPages: string[],
  formFields: string[],
  apiKey?: string,
): Promise<AITestScenarioSuggestion[] | null> {
  const apiClient = initializeClient(apiKey);
  if (!apiClient) {
    return null;
  }

  try {
    const prompt = buildTestAnalysisPrompt(flowType, flowPages, formFields);

    const response = await apiClient.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return parseTestSuggestions(content.text);
    }

    return null;
  } catch (error) {
    // Gracefully handle API errors - return null to trigger fallback
    return null;
  }
}

/**
 * Builds the prompt for test scenario analysis.
 */
function buildTestAnalysisPrompt(flowType: string, flowPages: string[], formFields: string[]): string {
  let prompt = `Analyze this web flow and suggest additional test scenarios.

Flow Type: ${flowType}
Pages in flow: ${flowPages.join(' -> ')}
Form fields: ${formFields.join(', ')}

Generate 1-2 additional test scenarios that would be valuable for this flow. For each scenario, provide:
- A descriptive name
- A brief description
- Key test steps
- Important assertions to verify

Focus on:
1. Error handling (invalid inputs, edge cases)
2. User experience (clear feedback, validation messages)
3. Security considerations (if applicable)

Format your response as JSON:
[
  {
    "name": "scenario name",
    "description": "brief description",
    "steps": ["step 1", "step 2"],
    "assertions": ["assertion 1", "assertion 2"]
  }
]`;

  return prompt;
}

/**
 * Parses AI response into test scenario suggestions.
 */
function parseTestSuggestions(response: string): AITestScenarioSuggestion[] | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          name: item.name || 'AI Suggested Test',
          description: item.description || '',
          steps: Array.isArray(item.steps) ? item.steps : [],
          assertions: Array.isArray(item.assertions) ? item.assertions : [],
        }));
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates AI-enhanced test data for a specific field type and context.
 * Returns null if API is unavailable, triggering fallback to pattern-based generation.
 *
 * @param fieldType - Type of the field (email, password, text, etc.)
 * @param context - Additional context about the field (name, placeholder, etc.)
 * @param apiKey - Optional API key. If provided, takes precedence over environment variable.
 * @returns Promise resolving to enhanced test data or null on failure
 */
export async function generateEnhancedTestData(
  fieldType: string,
  context: string,
  apiKey?: string,
): Promise<string | null> {
  const apiClient = initializeClient(apiKey);
  if (!apiClient) {
    return null;
  }

  try {
    const prompt = `Generate a realistic test value for a ${fieldType} field with context: ${context}. 
Respond with just the value, no explanation. For example, for an email field, respond with just "john.doe@example.com".`;

    const response = await apiClient.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    return null;
  } catch (error) {
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

