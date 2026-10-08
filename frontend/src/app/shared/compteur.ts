/**
 * Logique du compteur animé, extraite du composant pour être testable isolément.
 * Interpolation ease-out cubic : la valeur vient du temps écoulé, pas d'un setInterval.
 */

export const DUREE_COMPTEUR = 1800;

/**
 * Valeur affichée à `progression` (0 → 1) d'un compte de 0 vers `valeurCible`.
 * Courbe ease-out cubic : rapide au début, douce à la fin.
 */
export function valeurInterpolee(valeurCible: number, progression: number): number {
  const p = Math.min(1, Math.max(0, progression));
  return Math.round(valeurCible * (1 - Math.pow(1 - p, 3)));
}
