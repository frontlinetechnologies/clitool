import {
  createCrawlSummary,
  incrementTotalPages,
  incrementErrors,
  incrementSkipped,
  markInterrupted,
  finalizeCrawlSummary,
} from '../../../src/models/crawl-summary';

describe('CrawlSummary Model', () => {
  it('should create a crawl summary with start time', () => {
    const summary = createCrawlSummary();

    expect(summary.totalPages).toBe(0);
    expect(summary.errors).toBe(0);
    expect(summary.startTime).toBeDefined();
  });

  it('should increment total pages', () => {
    const summary = createCrawlSummary();
    const updated = incrementTotalPages(summary);

    expect(updated.totalPages).toBe(1);
  });

  it('should increment errors', () => {
    const summary = createCrawlSummary();
    const updated = incrementErrors(summary);

    expect(updated.errors).toBe(1);
  });

  it('should increment skipped', () => {
    const summary = createCrawlSummary();
    const updated = incrementSkipped(summary);

    expect(updated.skipped).toBe(1);
  });

  it('should mark as interrupted', () => {
    const summary = createCrawlSummary();
    const updated = markInterrupted(summary);

    expect(updated.interrupted).toBe(true);
  });

  it('should finalize with end time and duration', () => {
    const summary = createCrawlSummary();
    const startTime = new Date(summary.startTime);
    const endTime = new Date(startTime.getTime() + 5000); // 5 seconds later

    const finalized = finalizeCrawlSummary(summary, endTime);

    expect(finalized.endTime).toBe(endTime.toISOString());
    expect(finalized.duration).toBe(5);
  });
});

