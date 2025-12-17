import { test, expect } from '@playwright/test';

test.describe('Tests', () => {
  test('should navigate to https://shorturl.net/forgot-password/', async ({ page }) => {
    await page.goto('https://shorturl.net/forgot-password/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/ShortUrl\.net/);
    await expect(page).toHaveURL(new RegExp('https:\/\/shorturl\.net\/forgot-password\/'));
  });

});