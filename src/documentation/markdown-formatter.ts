/**
 * Markdown formatter for documentation output.
 * Converts documentation objects to Markdown strings with proper formatting.
 */

import { Documentation } from './models';

/**
 * Formats documentation as Markdown string.
 * Handles empty results by generating minimal documentation with explanatory message.
 *
 * @param doc - Documentation object to format
 * @returns Markdown string
 */
export function formatAsMarkdown(doc: Documentation): string {
  let markdown = `# ${doc.title}\n\n`;

  // Add empty results message if no pages
  if (doc.summary.totalPages === 0) {
    markdown += 'No pages were discovered during the crawl.\n\n';
  }

  // Summary section
  markdown += '## Summary\n\n';
  markdown += `- Total Pages: ${doc.summary.totalPages}\n`;
  markdown += `- Total Forms: ${doc.summary.totalForms}\n`;
  markdown += `- Total Buttons: ${doc.summary.totalButtons}\n`;
  markdown += `- Total Input Fields: ${doc.summary.totalInputFields}\n`;
  markdown += `- Critical Flows: ${doc.summary.criticalFlowsCount}\n`;
  markdown += `- Navigation Paths: ${doc.summary.navigationPathsCount}\n\n`;

  // Site Structure section
  if (doc.siteStructure.sections.length > 0 || doc.siteStructure.homePage) {
    markdown += '## Site Structure\n\n';
    
    if (doc.siteStructure.homePage) {
      markdown += `**Home Page**: ${doc.siteStructure.homePage}\n\n`;
    }

    if (doc.siteStructure.sections.length > 0) {
      for (const section of doc.siteStructure.sections) {
        markdown += `### ${section.name}\n\n`;
        for (const pageUrl of section.pages) {
          markdown += `- ${pageUrl}\n`;
        }
        markdown += '\n';
      }
    }
  }

  // Navigation Paths section
  if (doc.navigationPaths.length > 0) {
    markdown += '## Navigation Paths\n\n';
    for (const path of doc.navigationPaths) {
      if (path.description) {
        markdown += `**${path.description}**\n\n`;
      }
      markdown += path.pages.map((url, index) => {
        if (index === 0) {
          return `[${url}]`;
        }
        return ` → [${url}]`;
      }).join('') + '\n\n';
    }
  }

  // Critical User Flows section
  if (doc.criticalFlows.length > 0) {
    markdown += '## Critical User Flows\n\n';
    for (const flow of doc.criticalFlows) {
      markdown += `### ${flow.name}\n\n`;
      if (flow.description) {
        markdown += `${flow.description}\n\n`;
      }
      for (const page of flow.pages) {
        markdown += `${page.step}. ${page.url}`;
        if (page.role) {
          markdown += ` (${page.role})`;
        }
        markdown += '\n';
      }
      markdown += '\n';
    }
  }

  // Page Details section
  if (doc.pageDetails.length > 0) {
    markdown += '## Page Details\n\n';
    for (const page of doc.pageDetails) {
      markdown += `### ${page.url}\n\n`;
      
      if (page.title) {
        markdown += `**Title**: ${page.title}\n\n`;
      }

      if (page.description) {
        markdown += `**Description**: ${page.description}\n\n`;
      }

      if (page.section) {
        markdown += `**Section**: ${page.section}\n\n`;
      }

      if (page.forms && page.forms.length > 0) {
        markdown += `**Forms**: ${page.forms.length}\n`;
        for (const form of page.forms) {
          markdown += `  - ${form.method} ${form.action} (${form.inputCount} fields)\n`;
        }
        markdown += '\n';
      }

      if (page.buttons && page.buttons.length > 0) {
        markdown += `**Buttons**: ${page.buttons.length}\n`;
        for (const button of page.buttons) {
          const buttonText = button.text ? ` "${button.text}"` : '';
          markdown += `  - ${button.type}${buttonText}\n`;
        }
        markdown += '\n';
      }

      if (page.inputFields && page.inputFields.length > 0) {
        markdown += `**Input Fields**: ${page.inputFields.length}\n`;
        for (const field of page.inputFields) {
          const required = field.required ? ' (required)' : '';
          const name = field.name ? ` name="${field.name}"` : '';
          markdown += `  - ${field.type}${name}${required}\n`;
        }
        markdown += '\n';
      }

      if (page.links && page.links.length > 0) {
        markdown += `**Links**: ${page.links.length}\n`;
        for (const link of page.links.slice(0, 10)) { // Limit to first 10 links
          markdown += `  - ${link}\n`;
        }
        if (page.links.length > 10) {
          markdown += `  ... and ${page.links.length - 10} more\n`;
        }
        markdown += '\n';
      }

      markdown += '\n';
    }
  }

  // Footer
  markdown += `---\n\n`;
  markdown += `*Generated at: ${doc.generatedAt}*\n`;

  return markdown;
}

