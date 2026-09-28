import { HttpErrorResponse } from '@angular/common/http';
import { ErreurApi } from '../../shared/models/api';

/**
 * Message à afficher pour une erreur d'API. Les 4xx du backend portent un message métier
 * en français (ErreurApi) qu'on affiche tel quel ; le reste reçoit un message générique.
 */
export function messageErreur(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return 'Un problème est survenu. Réessayez.';
  if (err.status === 0) return 'Pas de connexion. Vérifiez votre réseau puis réessayez.';

  const corps = err.error as Partial<ErreurApi> | null;
  if (err.status >= 400 && err.status < 500 && typeof corps?.message === 'string' && corps.message) {
    return corps.message;
  }
  if (err.status === 403) return "Cette action n'est pas autorisée avec votre compte.";
  if (err.status === 404) return 'Élément introuvable.';
  return 'Le service ne répond pas correctement. Réessayez dans quelques instants.';
}
