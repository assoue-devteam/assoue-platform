import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Preuve lot 9 : les 4 compteurs de /notre-impact partent d'une valeur basse
 * à l'entrée dans la fenêtre puis atteignent 400 670, 801, 1 857 et 5.
 * Commande (depuis frontend/) : npx playwright test e2e/impact-compteurs.spec.ts
 */
const DOSSIER = path.join(__dirname, '..', '..', 'docs', 'captures');
const ATTENDU = ['400670', '801', '1857', '5'];

test.beforeAll(() => fs.mkdirSync(DOSSIER, { recursive: true }));

for (const largeur of [360, 1366]) {
  test(`compteurs animés à ${largeur} px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 800 });
    await page.goto('/notre-impact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.screenshot({ path: path.join(DOSSIER, `impact-avant-${largeur}.png`) });

    const bande = page.locator('.chiffres');
    await bande.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(DOSSIER, `impact-pendant-${largeur}.png`) });
    // Valeur basse juste après l'entrée : l'animation ease-out part de 0.
    const totaux = () => bande.locator('app-compteur-anime').evaluateAll(els =>
      els.map(el => (el.textContent ?? '').replace(/[\s\u202f]/g, '')));
    await expect.poll(totaux, 'les compteurs démarrent bas').not.toEqual(ATTENDU);

    await expect.poll(totaux, 'les compteurs atteignent les valeurs plaquette', { timeout: 8000 }).toEqual(ATTENDU);
    await page.screenshot({ path: path.join(DOSSIER, `impact-apres-${largeur}.png`), fullPage: true });
  });
}
