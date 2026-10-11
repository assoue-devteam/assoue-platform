import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Captures de livraison (lots 7-9) dans docs/captures, à 360 et 1366 px.
 *
 * Commande (depuis frontend/) : npx playwright test e2e/captures.spec.ts
 * Prérequis : backend démarré avec la base seedée (seed_demo_dev.sql :
 * admin@assoue.bf / Password123!), le front est servi automatiquement
 * (voir playwright.config.ts). Sans backend, seules les captures publiques
 * en état d'erreur sont produites.
 *
 * Authentification : compte de démo seedé, surchargeable par
 * ASSOUE_E2E_EMAIL / ASSOUE_E2E_PASSWORD.
 */
const DOSSIER = path.join(__dirname, '..', '..', 'docs', 'captures');
const EMAIL = process.env.ASSOUE_E2E_EMAIL ?? 'admin@assoue.bf';
const MOT_DE_PASSE = process.env.ASSOUE_E2E_PASSWORD ?? 'Password123!';

test.beforeAll(() => fs.mkdirSync(DOSSIER, { recursive: true }));

async function photo(page: Page, nom: string, pleinePage = false): Promise<void> {
  await page.screenshot({ path: path.join(DOSSIER, nom), fullPage: pleinePage });
}

async function connecter(page: Page, email = EMAIL, motDePasse = MOT_DE_PASSE): Promise<boolean> {
  await page.goto('/connexion');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(motDePasse);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  return page.waitForURL(url => !url.pathname.startsWith('/connexion'), { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
}

for (const largeur of [360, 1366]) {
  test(`catalogue à ${largeur} px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await photo(page, `catalogue-${largeur}.png`, true);
  });

  test(`impact complète à ${largeur} px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 800 });
    await page.goto('/notre-impact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Valeurs finales après l'animation des compteurs (1,6 s).
    await page.waitForTimeout(2000);
    await photo(page, `impact-${largeur}.png`, true);
  });

  test(`communauté à ${largeur} px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 800 });
    await page.goto('/communaute');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await photo(page, `communaute-${largeur}.png`, true);
  });
}

test('menu burger ouvert à 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: /menu/i }).click();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
  await photo(page, 'menu-burger-360.png');
});

test('menu profil fermé puis ouvert (client)', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  test.skip(!await connecter(page, 'client@assoue.bf', MOT_DE_PASSE), 'base seedée requise');
  await page.goto('/');
  const declencheur = page.locator('.compte__bouton');
  await expect(declencheur).toBeVisible();
  await photo(page, 'menu-profil-ferme-1366.png');
  await declencheur.click();
  await expect(page.locator('.compte__menu')).toBeVisible();
  await photo(page, 'menu-profil-ouvert-1366.png');
});

test('zone de dépôt : vide, glissement, erreur', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  test.skip(!await connecter(page), 'compte admin seedé requis');
  await page.goto('/gestion/produits');
  await page.getByRole('button', { name: 'Nouveau produit' }).click();
  const depot = page.locator('.depot');
  await expect(depot).toBeVisible();
  await photo(page, 'depot-vide-1366.png');

  // État de survol avec fichier (sans vrai glisser-déposer système).
  await depot.evaluate(el => {
    const transfert = new DataTransfer();
    transfert.items.add(new File(['x'], 'photo.jpg', { type: 'image/jpeg' }));
    el.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: transfert }));
  });
  await photo(page, 'depot-glissement-1366.png');

  // Fichier illisible : refus sans appel réseau (les photos valides sont réduites avant l'envoi).
  await page.locator('input[type="file"]').setInputFiles({
    name: 'grosse.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.alloc(6 * 1024 * 1024),
  });
  await expect(page.getByRole('alert')).toContainText('pas une image lisible');
  await photo(page, 'depot-erreur-1366.png');
});

test('zone de dépôt : envoi puis succès', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  test.skip(!await connecter(page), 'compte admin seedé requis');
  await page.goto('/gestion/produits');
  await page.getByRole('button', { name: 'Nouveau produit' }).click();

  // Réponse différée pour figer l'état « envoi en cours ».
  await page.route('**/api/images', async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.fulfill({ json: { cle: '11111111-2222-3333-4444-555555555555.jpg' } });
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: 'photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('faux-jpeg-pour-la-capture'),
  });
  await expect(page.locator('progress')).toBeVisible();
  await photo(page, 'depot-envoi-1366.png');
  await expect(page.locator('.depot img')).toBeVisible({ timeout: 10_000 });
  await photo(page, 'depot-succes-1366.png');
});
