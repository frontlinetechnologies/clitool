import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should navigate to Login form with email and password', async ({ page }) => {
    await page.goto('https://shorturl.net/login/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/ShortUrl\.net/);
    await expect(page).toHaveURL(new RegExp('https:\/\/shorturl\.net\/login\/'));
  });

  test('should navigate to Post-login redirect', async ({ page }) => {
    await page.goto('https://shorturl.net/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/shorturl\.net - Fast & Simple URL Shortener/);
    await expect(page).toHaveURL(new RegExp('https:\/\/shorturl\.net\/'));
  });

  test('should fill login form and submit', async ({ page }) => {
    await page.goto('https://shorturl.net/login/');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('test.user@example.com');
    await page.locator('#password').fill('TestPassword123!');
    await page.locator('#remember_me').fill('Test remember');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(new RegExp('https:\/\/shorturl\.net\/'));
  });

  test('login fails and shows error message when captcha field is left empty', async ({ page }) => {
    await page.goto('https://shorturl.net/login/');
    await page.getByLabel('email').fill('valid.user@example.com');
    await page.getByLabel('password').fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Login' }).click();
    // Error message about captcha should be visible
    await expect(page.getByText('captcha')).toBeVisible();
    // User should remain on login page when captcha validation fails
    await expect(page).toHaveURL(new RegExp('\/login'));
  });

  test('remember me checkbox persists login state after successful authentication', async ({ page }) => {
    await page.goto('https://shorturl.net/login/');
    await page.getByLabel('email').fill('test.user@example.com');
    await page.getByLabel('password').fill('SecurePass123!');
    await page.getByLabel('Enter the captcha').fill('ABC123');
    await page.getByRole('button', { name: 'Login' }).click();
    // User should be redirected to homepage after successful login
    await expect(page).toHaveURL(new RegExp('https:\/\/shorturl\.net\/'));
    // Login form should not be visible after successful authentication
    await expect(page.getByLabel('email')).toBeHidden();
  });

});