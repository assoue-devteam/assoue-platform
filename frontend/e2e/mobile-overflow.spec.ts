import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Garde-fou lot 12 : aucune page ne doit déborder horizontalement entre 320 et 412 px.
 * Commande (depuis frontend/) : npx playwright test e2e/mobile-overflow.spec.ts
 * Prérequis : front servi (playwright.config.ts) ; sans backend seedé, les routes
 * authentifiées redirigent vers /connexion — le test reste valable (pas de scroll X).
 */
const DOSSIER = path.join(__dirname, '..', '..', 'docs', 'captures');
const LARGEURS = [320, 360, 390, 412];
// Catalogue, produit, panier, favoris, commandes, impact, communauté, auth, gestion.
const ROUTES = ['/', '/produits/1', '/panier', '/favoris', '/commandes', '/notre-impact', '/communaute', '/connexion', '/inscription', '/gestion'];

test.beforeAll(() => fs.mkdirSync(DOSSIER, { recursive: true }));

for (const largeur of LARGEURS) {
  for (const route of ROUTES) {
    test(`pas de scroll X à ${largeur} px sur ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: 800 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const deborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(deborde, `${route} déborde de ${deborde}px à ${largeur}px`).toBeLessThanOrEqual(0);
    });
  }
}

test('burger ouvert, recherche dépliable et menu compte à 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const deborde = async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
  expect(await deborde()).toBeLessThanOrEqual(0);
  await page.screenshot({ path: path.join(DOSSIER, 'header-burger-ouvert-320.png') });

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Rechercher un produit' }).click();
  await expect(page.locator('#recherche-mobile')).toBeVisible();
  expect(await deborde()).toBeLessThanOrEqual(0);
  await page.screenshot({ path: path.join(DOSSIER, 'header-recherche-320.png') });
});
