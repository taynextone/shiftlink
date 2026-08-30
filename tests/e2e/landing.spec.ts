import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays the homepage with Shiftlink branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Shiftlink', { exact: true }).first()).toBeVisible();
    await expect(page.locator('h1')).toContainText('Direkt vermittelt');
  });

  test('has registration and login links for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Als Pflegekraft starten' })).toHaveAttribute('href', '/register');
  });

  test('positions Shiftlink as direct matching rather than temporary employment', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Keine Zeitarbeitsfirma dazwischen');
    await expect(page.locator('body')).toContainText('direkte Vermittlung');
  });

  test('stays usable without horizontal overflow on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const layout = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
    }));
    expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth);

    const hero = page.locator('.hero');
    await expect(hero.locator('h1')).toBeVisible();
    const heroBox = await hero.boundingBox();
    expect(heroBox?.width).toBeLessThanOrEqual(390);

    const primaryActions = hero.locator('.btn');
    await expect(primaryActions.first()).toBeVisible();
    for (const button of await primaryActions.all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});
