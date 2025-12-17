/**
 * Template engine for variable substitution in prompts.
 * Feature: 001-ai-system-prompts
 */

import { PromptVariable, PromptContext } from './types';
import { createPromptError, PromptErrorType } from './errors';

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;
const CONDITIONAL_REGEX = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

export interface TemplateRenderResult {
  rendered: string;
  substituted: string[];
  missingOptional: string[];
}

/**
 * Renders a prompt template with the provided context variables.
 *
 * @param template - The template content with {{variable}} placeholders
 * @param context - Variables and options for rendering
 * @param variables - Variable definitions from the prompt
 * @param filePath - File path for error messages
 * @returns The rendered template with substitution info
 * @throws PromptError if required variables are missing
 */
export function renderTemplate(
  template: string,
  context: PromptContext,
  variables: PromptVariable[],
  filePath: string
): TemplateRenderResult {
  const substituted: string[] = [];
  const missingOptional: string[] = [];

  // Check for missing required variables
  for (const variable of variables) {
    if (variable.required && context.variables[variable.name] === undefined) {
      throw createPromptError(
        PromptErrorType.MISSING_REQUIRED_VARIABLE,
        `Missing required variable '${variable.name}'`,
        {
          filePath,
          field: variable.name,
          suggestions: [
            `Provide '${variable.name}' in the context.variables object`,
            `Variable description: ${variable.description}`,
          ],
        }
      );
    }
  }

  // Process conditionals first
  let rendered = template.replace(
    CONDITIONAL_REGEX,
    (_: string, varName: string, content: string) => {
      const value = context.variables[varName];
      if (value !== undefined && value !== '') {
        return content;
      }
      return '';
    }
  );

  // Then substitute variables
  rendered = rendered.replace(
    VARIABLE_REGEX,
    (match: string, varName: string) => {
      const value = context.variables[varName];
      const varDef = variables.find((v) => v.name === varName);

      if (value !== undefined) {
        substituted.push(varName);
        return value;
      }

      if (varDef?.defaultValue !== undefined) {
        substituted.push(varName);
        return varDef.defaultValue;
      }

      if (varDef && !varDef.required) {
        missingOptional.push(varName);
        return '';
      }

      // Unknown variable - leave as-is for debugging
      return match;
    }
  );

  return { rendered, substituted, missingOptional };
}
