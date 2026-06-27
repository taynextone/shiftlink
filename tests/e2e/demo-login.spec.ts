import { test, expect } from '@playwright/test';

test.describe('Demo Login Flow', () => {
  test('demo login as nurse redirects to nurse dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Demo: Pflegekraft').click();
    // After demo login, should be on nurse page
    await expect(page).toHaveURL(/\/nurse/);
  });

  test('demo login as hospital redirects to hospital dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Demo: Krankenhaus').click();
    // After demo login, should be on hospital page
    await expect(page).toHaveURL(/\/hospital/);
  });
});
