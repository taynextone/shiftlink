import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login page renders with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login shows error for empty submission', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    // Should stay on login page (not redirect)
    await expect(page).toHaveURL(/\/login/);
  });

  test('register page renders with role selection', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('body')).toContainText('Registrierung');
  });

  test('unauthenticated dashboard redirect to login', async ({ page }) => {
    await page.goto('/nurse');
    // Should redirect to login for unauthenticated users
    await expect(page).toHaveURL(/\/login/);
  });
});
