/**
 * Anthropic API client wrapper for page analysis.
 * Handles API initialization, error handling, and provides graceful fallback behavior.
 */

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

/**
 * Resets the client (for testing purposes).
 */
export function resetClient(): void {
  client = null;
}

/**
 * Initializes the Anthropic API client with API key from environment variable.
 * Returns null if API key is not available or initialization fails.
 */
export function initializeClient(): Anthropic | null {
  if (client !== null) {
    return client;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    client = new Anthropic({
      apiKey,
    });
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
 * @returns Promise resolving to description string or null on failure
 */
export async function analyzePage(
  pageUrl: string,
  pageTitle?: string,
  pageContent?: string,
): Promise<string | null> {
  const apiClient = initializeClient();
  if (!apiClient) {
    return null;
  }

  try {
    // Build prompt for page analysis
    const prompt = buildAnalysisPrompt(pageUrl, pageTitle, pageContent);

    const response = await apiClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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

