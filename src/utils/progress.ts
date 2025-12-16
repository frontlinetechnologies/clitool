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

  constructor(quiet: boolean = false) {
    this.quiet = quiet;
  }

  update(current: number, _total: number, currentURL: string): void {
    if (this.quiet) {
      return;
    }

    // Use carriage return to update same line
    process.stdout.write(
      `\rCrawling... [${current} pages discovered] Current: ${currentURL}`,
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
 * @returns A progress reporter
 */
export function createProgressReporter(quiet: boolean = false): ProgressReporter {
  return new ConsoleProgressReporter(quiet);
}

