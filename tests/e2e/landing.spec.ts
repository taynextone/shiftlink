import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays the homepage with Shiftlink branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Shiftlink');
  });

  test('has_Register and login links for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Registrierung')).toBeVisible();
    await expect(page.getByText('Login')).toBeVisible();
  });

  test('product description mentions Berlin pilot region', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Pilotregion Berlin');
  });
});
