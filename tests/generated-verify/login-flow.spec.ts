import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should navigate to Login form with email and password', async ({ page }) => {
    await page.goto('https://shorturl.net/login/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/ShortUrl\.net/);
    await expect(page).toHaveURL(/https://shorturl\.net/login//);
  });

  test('should navigate to Post-login redirect', async ({ page }) => {
    await page.goto('https://shorturl.net/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/shorturl\.net - Fast & Simple URL Shortener/);
    await expect(page).toHaveURL(/https://shorturl\.net//);
  });

  test('should fill login form and submit', async ({ page }) => {
    await page.goto('https://shorturl.net/login/');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('test.user@example.com');
    await page.locator('#password').fill('TestPassword123!');
    await page.locator('#remember_me').fill('Test remember');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/https://shorturl\.net//);
  });

});