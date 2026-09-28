import { expect, test } from '@playwright/test';

test('la page de connexion expose un parcours public utilisable', async ({ page }) => {
  await page.goto('/connexion');

  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { name: /se connecter/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /connecter|connexion/i })).toBeVisible();
});

test('une route collecteur protégée redirige vers la connexion', async ({ page }) => {
  await page.goto('/collecte');

  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByRole('heading', { name: /se connecter/i })).toBeVisible();
});

test('le formulaire d inscription reste sans débordement sur mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/inscription');

  await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible();
  const noHorizontalOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noHorizontalOverflow).toBe(true);
});
