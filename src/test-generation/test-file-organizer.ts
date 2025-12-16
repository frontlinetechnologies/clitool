/**
 * Test file organizer utility for organizing test files by flow.
 * Handles naming conventions and ensures one file per flow per FR-018.
 */

import { UserFlow } from '../documentation/models';
import { TestFile } from './models';

/**
 * Organizes test files by flow, ensuring one file per flow.
 * Converts flow names to kebab-case filenames and handles naming conflicts.
 *
 * @param flows - Array of detected user flows
 * @param testFiles - Array of test files to organize
 * @returns Map of flow name to test file
 */
export function organizeTestFilesByFlow(flows: UserFlow[], testFiles: TestFile[]): Map<string, TestFile> {
  const flowToFileMap = new Map<string, TestFile>();

  for (const flow of flows) {
    const filename = generateFlowFilename(flow.name, flowToFileMap);
    const existingFile = testFiles.find((f) => f.filename === filename);

    if (existingFile) {
      flowToFileMap.set(flow.name, existingFile);
    } else {
      // Create new test file for this flow
      const testFile: TestFile = {
        filename,
        flow,
        testCases: [],
        imports: ["import { test, expect } from '@playwright/test';"],
        code: '',
      };
      flowToFileMap.set(flow.name, testFile);
    }
  }

  return flowToFileMap;
}

/**
 * Generates a filename for a flow, converting to kebab-case and handling conflicts.
 *
 * @param flowName - Name of the flow (e.g., "Login Flow")
 * @param existingFiles - Map of existing flow names to files
 * @returns Filename in format "{flow-name}-flow.spec.ts"
 */
export function generateFlowFilename(flowName: string, existingFiles?: Map<string, TestFile>): string {
  // Convert to kebab-case
  let kebabCase = flowName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Ensure it ends with "-flow" if not already
  if (!kebabCase.endsWith('-flow')) {
    kebabCase = `${kebabCase}-flow`;
  }

  // Add .spec.ts extension
  let filename = `${kebabCase}.spec.ts`;

  // Handle conflicts by appending number
  if (existingFiles) {
    let counter = 2;
    const baseFilename = filename;
    while (Array.from(existingFiles.values()).some((f) => f.filename === filename)) {
      filename = baseFilename.replace('.spec.ts', `-${counter}.spec.ts`);
      counter++;
    }
  }

  return filename;
}

/**
 * Generates filename for navigation tests (pages without flows).
 *
 * @returns Filename for navigation tests
 */
export function generateNavigationFilename(): string {
  return 'navigation.spec.ts';
}

/**
 * Generates filename for empty results.
 *
 * @returns Filename for empty results
 */
export function generateEmptyResultsFilename(): string {
  return 'empty-results.spec.ts';
}

