import { createRateLimiter, exponentialBackoff } from '../../../src/utils/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should enforce delay between requests', async () => {
    const limiter = createRateLimiter(1); // 1 second delay

    const start1 = Date.now();
    await limiter.wait();
    const end1 = Date.now();

    // First request should not wait
    expect(end1 - start1).toBeLessThan(100);

    // Advance time by 500ms
    jest.advanceTimersByTime(500);

    const start2 = Date.now();
    const waitPromise = limiter.wait();
    jest.advanceTimersByTime(500);
    await waitPromise;
    const end2 = Date.now();

    // Second request should wait for remaining 500ms
    expect(end2 - start2).toBeGreaterThanOrEqual(500);
  });

  it('should not wait if enough time has passed', async () => {
    const limiter = createRateLimiter(0.5); // 0.5 second delay

    await limiter.wait();

    // Advance time by 1 second
    jest.advanceTimersByTime(1000);

    const start = Date.now();
    await limiter.wait();
    const end = Date.now();

    // Should not wait since enough time has passed
    expect(end - start).toBeLessThan(100);
  });
});

describe('Exponential Backoff', () => {
  it('should calculate exponential backoff delays', () => {
    expect(exponentialBackoff(0, 1000)).toBe(1000); // 2^0 * 1000 = 1000ms
    expect(exponentialBackoff(1, 1000)).toBe(2000); // 2^1 * 1000 = 2000ms
    expect(exponentialBackoff(2, 1000)).toBe(4000); // 2^2 * 1000 = 4000ms
    expect(exponentialBackoff(3, 1000)).toBe(8000); // 2^3 * 1000 = 8000ms
  });
});

