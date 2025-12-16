import { test, expect } from '@playwright/test';

test.describe('Form Submission Flow (https://shorturl.net/)', () => {
  test('should navigate to Step 1 of form submission', async ({ page }) => {
    await page.goto('https://shorturl.net/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/shorturl\.net - Fast & Simple URL Shortener/);
    await expect(page).toHaveURL(/https://shorturl\.net//);
  });

  test('should navigate to Step 2 of form submission', async ({ page }) => {
    await page.goto('https://shorturl.net/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/shorturl\.net - Fast & Simple URL Shortener/);
    await expect(page).toHaveURL(/https://shorturl\.net//);
  });

  test('should complete form submission flow (https://shorturl.net/)', async ({ page }) => {
    await page.goto('https://shorturl.net/');
    await page.waitForLoadState('networkidle');
    await page.locator('#longUrl').fill('Test https://example.com/your/long/url');
    await page.getByRole('button', { name: 'Shorten URL' }).click();
    await page.locator('#contact-name').fill('Test name');
    await page.locator('#contact-email').fill('test.user@example.com');
    await page.locator('#contact-message').fill('Test your message here...');
    await page.locator('#contact-captcha').fill('Test enter the captcha');
    await page.getByRole('button', { name: 'Shorten URL' }).click();
    await page.goto('https://shorturl.net/');
    await page.waitForLoadState('networkidle');
    await page.locator('#longUrl').fill('Test https://example.com/your/long/url');
    await page.getByRole('button', { name: 'Shorten URL' }).click();
    await page.locator('#contact-name').fill('Test name');
    await page.locator('#contact-email').fill('test.user@example.com');
    await page.locator('#contact-message').fill('Test your message here...');
    await page.locator('#contact-captcha').fill('Test enter the captcha');
    await page.getByRole('button', { name: 'Shorten URL' }).click();
    await expect(page).toHaveURL(/https://shorturl\.net//);
  });

});