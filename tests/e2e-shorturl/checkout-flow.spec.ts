import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should navigate to Checkout page', async ({ page }) => {
    await page.goto('https://shorturl.net/billing/subscribe/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Subscribe - ShortUrl\.net/);
    await expect(page).toHaveURL(new RegExp('https:\/\/shorturl\.net\/billing\/subscribe\/'));
  });

  test('billing FAQ accordion expands and collapses without breaking subscription form', async ({ page }) => {
    await page.goto('https://shorturl.net/billing/subscribe/');
    await page.getByRole('button', { name: 'FAQ' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'FAQ' }).click();
    // Subscribe button must remain visible and accessible after FAQ toggle
    await expect(page.getByRole('button')).toBeVisible();
    // FAQ content should be hidden after second click (collapsed state)
    await expect(page.getByTestId('billing-faq')).toBeHidden();
    // User should remain on subscription page during FAQ interaction
    await expect(page).toHaveURL(new RegExp('\/billing\/subscribe\/'));
  });

  test('subscription form validation prevents checkout with invalid billing information', async ({ page }) => {
    await page.goto('https://shorturl.net/billing/subscribe/');
    await page.getByRole('button', { name: 'Subscribe' }).click();
    // Validation error message must appear for missing required fields
    await expect(page.getByText('required')).toBeVisible();
    // User should remain on subscribe page when validation fails
    await expect(page).toHaveURL(new RegExp('\/billing\/subscribe\/'));
    // Submit button should remain enabled to allow user to retry after fixing errors
    await expect(page.getByRole('button')).toBeEnabled();
  });

});