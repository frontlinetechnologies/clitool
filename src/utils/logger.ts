/**
 * Structured logging utility with quiet mode support.
 * Provides consistent logging interface for the crawler.
 */

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

class ConsoleLogger implements Logger {
  constructor(private readonly quiet: boolean = false) {}

  info(message: string, ...args: unknown[]): void {
    if (!this.quiet) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    // Errors are always shown, even in quiet mode
    console.error(`[ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.quiet) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.quiet) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

let defaultLogger: Logger = new ConsoleLogger(false);

/**
 * Creates a logger instance.
 * @param quiet - If true, suppresses info/warn/debug messages (errors always shown)
 * @returns A logger instance
 */
export function createLogger(quiet: boolean = false): Logger {
  return new ConsoleLogger(quiet);
}

/**
 * Sets the default logger instance.
 * @param logger - The logger to use as default
 */
export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger;
}

/**
 * Gets the default logger instance.
 * @returns The default logger
 */
export function getLogger(): Logger {
  return defaultLogger;
}

