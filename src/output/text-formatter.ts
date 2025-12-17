/**
 * Text formatter for crawl results.
 * Formats crawl results as human-readable text summary.
 */

import { CrawlResults } from './json-formatter';
import { StopReason } from '../models/crawl-summary';

/**
 * Formats stop reason as human-readable text.
 */
function formatStopReason(reason: StopReason | undefined): string {
  switch (reason) {
    case 'completed':
      return 'Crawl completed normally';
    case 'max_pages_reached':
      return 'Stopped: Maximum page limit reached';
    case 'interrupted':
      return 'Stopped: User interrupted (Ctrl+C)';
    case 'error':
      return 'Stopped: Fatal error occurred';
    default:
      return '';
  }
}

/**
 * Formats crawl results as human-readable text.
 */
export function formatAsText(results: CrawlResults): string {
  const { summary, pages } = results;

  let output = 'Crawl Summary\n';
  output += '=============\n';
  output += `Total Pages: ${summary.totalPages}\n`;
  output += `Total Forms: ${summary.totalForms}\n`;
  output += `Total Buttons: ${summary.totalButtons}\n`;
  output += `Total Input Fields: ${summary.totalInputFields}\n`;
  output += `Errors: ${summary.errors}\n`;
  output += `Skipped: ${summary.skipped}\n`;

  // Show limits if set
  if (summary.maxPagesLimit !== undefined) {
    output += `Max Pages Limit: ${summary.maxPagesLimit}\n`;
  }
  if (summary.maxDepthLimit !== undefined) {
    output += `Max Depth Limit: ${summary.maxDepthLimit}\n`;
  }

  if (summary.duration !== undefined) {
    const minutes = Math.floor(summary.duration / 60);
    const seconds = summary.duration % 60;
    output += `Duration: ${minutes}m ${seconds}s\n`;
  }

  // Show stop reason
  if (summary.stopReason) {
    const stopReasonText = formatStopReason(summary.stopReason);
    if (stopReasonText) {
      if (summary.stopReason === 'interrupted') {
        output += `\n⚠️  ${stopReasonText}\n`;
      } else if (summary.stopReason === 'max_pages_reached') {
        output += `\nℹ️  ${stopReasonText}\n`;
      } else if (summary.stopReason === 'error') {
        output += `\n❌  ${stopReasonText}\n`;
      }
    }
  } else if (summary.interrupted) {
    // Legacy support for interrupted flag without stopReason
    output += '\n⚠️  Crawl was interrupted\n';
  }

  // Error summary
  if (summary.errors > 0) {
    output += '\nError Summary:\n';
    const errorPages = pages.filter((p) => p.error || p.status >= 400);
    errorPages.slice(0, 10).forEach((page) => {
      output += `  - ${page.url}`;
      if (page.error) {
        output += `: ${page.error}`;
      } else if (page.status) {
        output += `: HTTP ${page.status}`;
      }
      output += '\n';
    });
    if (errorPages.length > 10) {
      output += `  ... and ${errorPages.length - 10} more errors\n`;
    }
  }

  // Skipped pages summary
  if (summary.skipped > 0) {
    output += '\nSkipped Pages:\n';
    output += `  ${summary.skipped} pages were skipped (robots.txt disallowed, etc.)\n`;
  }

  // Pages list (if not too many)
  if (pages.length > 0 && pages.length <= 50) {
    output += '\nPages:\n';
    pages.forEach((page) => {
      output += `  - ${page.url}`;
      if (page.title) {
        output += ` (${page.title})`;
      }
      if (page.status) {
        output += ` [${page.status}]`;
      }
      output += '\n';
    });
  } else if (pages.length > 50) {
    output += `\nPages: ${pages.length} pages discovered (use --verbose to see all)\n`;
  }

  return output;
}

