import { expect, test } from '@playwright/test';

/**
 * Non-régression du bug « Participer » rogné : avec une photo, le bloc image
 * prenait la taille intrinsèque de la photo (ratio naturel au lieu de 16/9),
 * la carte était bornée par sa ligne grid et `overflow: hidden` coupait la
 * description et le bouton (mesuré : bouton 73 px sous le bas de la carte à
 * 360 px). Le test vérifie la géométrie, pas le contenu : le bouton doit
 * rester dans les limites de sa carte et le bloc image garder son 16/9,
 * avec une photo portrait comme paysage, à 360 et 1280 px.
 *
 * Données 100 % mockées (aucun backend requis) : les images sont des SVG avec
 * dimensions intrinsèques, servis par interception de route.
 *
 * Commande (depuis frontend/) : npx playwright test e2e/communaute-participer.spec.ts
 */
const PORTRAIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="800"><rect width="400" height="800" fill="#166534"/></svg>`;
const PAYSAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="#15803D"/></svg>`;

async function mockCommunauté(page, avecPhoto: boolean) {
  await page.route('**/api/communaute/chiffres', route => route.fulfill({ json: [] }));
  await page.route('**/api/evenements', route => route.fulfill({
    json: [
      { id: 1, titre: 'Atelier portrait', dateDebut: '2099-12-15T09:00:00', lieu: 'Ouagadougou', description: 'Description affichée sous la photo.', imageUrl: avecPhoto ? '/api/images-test/portrait.svg' : null, imageCle: null, placesRestantes: 12 },
      { id: 2, titre: 'Atelier paysage', dateDebut: '2099-12-16T09:00:00', lieu: 'Bobo-Dioulasso', description: 'Autre description.', imageUrl: avecPhoto ? '/api/images-test/paysage.svg' : null, imageCle: null, placesRestantes: null },
    ],
  }));
  await page.route('**/api/images-test/*', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: route.request().url().endsWith('portrait.svg') ? PORTRAIT_SVG : PAYSAGE_SVG,
  }));
}

for (const largeur of [360, 1280]) {
  for (const avecPhoto of [true, false]) {
    test(`bouton Participer dans la carte à ${largeur} px (photo : ${avecPhoto ? 'oui' : 'non'})`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: 800 });
      await mockCommunauté(page, avecPhoto);
      await page.goto('/communaute');
      const cartes = page.locator('.evenement');
      await expect(cartes).toHaveCount(2);

      for (let i = 0; i < 2; i++) {
        const carte = cartes.nth(i);
        const blocImage = carte.locator('.evenement__image');
        const bouton = carte.locator('.participer');
        await expect(bouton).toBeVisible();

        const cadreCarte = await carte.boundingBox();
        const cadreImage = await blocImage.boundingBox();
        const cadreBouton = await bouton.boundingBox();
        expect(cadreCarte, 'carte mesurable').not.toBeNull();
        expect(cadreImage, 'bloc image mesurable').not.toBeNull();
        expect(cadreBouton, 'bouton mesurable').not.toBeNull();
        if (!cadreCarte || !cadreImage || !cadreBouton) continue;

        // Le bouton reste entièrement dans sa carte (ni rogné ni poussé dehors).
        expect(cadreBouton.y + cadreBouton.height).toBeLessThanOrEqual(cadreCarte.y + cadreCarte.height + 1);
        expect(cadreBouton.y).toBeGreaterThanOrEqual(cadreCarte.y);
        if (avecPhoto) {
          // Bloc image déterministe : 16/9 quelle que soit la photo, sans déborder.
          expect(Math.abs(cadreImage.height - (cadreImage.width * 9) / 16)).toBeLessThanOrEqual(2);
          expect(cadreImage.x + cadreImage.width).toBeLessThanOrEqual(cadreCarte.x + cadreCarte.width + 1);
        }
      }
    });
  }
}
