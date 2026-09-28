import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../../shared/models/api';
import { AuthService } from './auth.service';

/** Protège un espace : non connecté ou session expirée → connexion, mauvais rôle → accès refusé. */
export function roleGuard(role: Role): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.connecte() || auth.estExpiree()) {
      const raison = auth.connecte() ? { raison: 'expiree' } : {};
      return router.createUrlTree(['/connexion'], { queryParams: { retour: state.url, ...raison } });
    }
    return auth.aRole(role) ? true : router.createUrlTree(['/acces-refuse']);
  };
}
