/**
 * Signal handler utilities for graceful shutdown.
 * Handles SIGINT (Ctrl+C) and SIGTERM signals to allow clean shutdown.
 */

let isInterrupted = false;
let interruptHandlers: Array<() => void> = [];

/**
 * Checks if the process has been interrupted.
 * @returns true if interrupt signal received, false otherwise
 */
export function isInterruptedSignal(): boolean {
  return isInterrupted;
}

/**
 * Registers a handler to be called when interrupt signal is received.
 * @param handler - Function to call on interrupt
 */
export function onInterrupt(handler: () => void): void {
  interruptHandlers.push(handler);
}

/**
 * Removes an interrupt handler.
 * @param handler - Handler function to remove
 */
export function removeInterruptHandler(handler: () => void): void {
  interruptHandlers = interruptHandlers.filter((h) => h !== handler);
}

/**
 * Handles interrupt signals (SIGINT, SIGTERM).
 * Sets the interrupted flag and calls all registered handlers.
 */
function handleInterrupt(): void {
  if (isInterrupted) {
    // Already interrupted, force exit
    process.exit(130);
    return;
  }

  isInterrupted = true;
  console.error('\n\nInterrupt signal received. Shutting down gracefully...');

  // Call all registered handlers
  for (const handler of interruptHandlers) {
    try {
      handler();
    } catch (error) {
      console.error('Error in interrupt handler:', error);
    }
  }
}

/**
 * Sets up signal handlers for SIGINT and SIGTERM.
 * Should be called once at application startup.
 */
export function setupSignalHandlers(): void {
  process.on('SIGINT', handleInterrupt);
  process.on('SIGTERM', handleInterrupt);
}

/**
 * Resets the interrupt state (useful for testing).
 */
export function resetInterruptState(): void {
  isInterrupted = false;
  interruptHandlers = [];
}

