/**
 * Progress reporting utility with real-time updates and quiet mode support.
 * Uses carriage return for in-place updates.
 */

export interface ProgressReporter {
  update(current: number, total: number, currentURL: string): void;
  finish(): void;
}

class ConsoleProgressReporter implements ProgressReporter {
  private quiet: boolean;
  private maxPages?: number;

  constructor(quiet: boolean = false, maxPages?: number) {
    this.quiet = quiet;
    this.maxPages = maxPages;
  }

  update(current: number, _total: number, currentURL: string): void {
    if (this.quiet) {
      return;
    }

    // Build progress string with optional limit indicator
    let progressStr: string;
    if (this.maxPages !== undefined) {
      progressStr = `[${current}/${this.maxPages} max pages]`;
    } else {
      progressStr = `[${current} pages discovered]`;
    }

    // Use carriage return to update same line
    process.stdout.write(
      `\rCrawling... ${progressStr} Current: ${currentURL}`,
    );
  }

  finish(): void {
    if (!this.quiet) {
      process.stdout.write('\n');
    }
  }
}

/**
 * Creates a progress reporter instance.
 * @param quiet - If true, suppresses progress updates
 * @param maxPages - Optional max pages limit to display
 * @returns A progress reporter
 */
export function createProgressReporter(quiet: boolean = false, maxPages?: number): ProgressReporter {
  return new ConsoleProgressReporter(quiet, maxPages);
}

