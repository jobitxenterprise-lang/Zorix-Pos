import { test, expect } from '@playwright/test';

test('Carga inicial de la aplicación Zorix POS', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Zorix/i);
});

