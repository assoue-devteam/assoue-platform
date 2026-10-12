import { formatNumber } from '@angular/common';

/**
 * Entier formaté en français (séparateur de milliers = espace fine insécable
 * U+202F : « 400 670 »). Même fonction pour les prix (FcfaPipe) et les
 * compteurs animés, pour un rendu identique partout.
 */
export function formaterNombreFr(nombre: number): string {
  return formatNumber(nombre, 'fr', '1.0-0');
}
