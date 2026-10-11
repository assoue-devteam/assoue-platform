import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { NetworkService } from '../network.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const auth = inject(AuthService);
  const reseau = inject(NetworkService);
  const token = auth.tokenValide();
  const requete = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requete).pipe(
    tap({
      next: () => reseau.marquerSuccesApi(),
      error: (err: HttpErrorResponse) => {
        // Pas de réponse du tout (réseau coupé, backend arrêté...) : l'UI passe hors ligne.
        if (err.status === 0) reseau.marquerEchecApi();
        // 401 = session absente/expirée (entry point + WWW-Authenticate), 403 = rôle
        // insuffisant : on ne lève la modale que si le JWT local est expiré (GAP-07).
        // Les appels /api/auth/** (login/register) sont exclus : leur 401/403 est une erreur
        // métier (identifiants incorrects), pas une session expirée — sinon boucle de modales.
        const estAppelAuth = req.url.includes('/api/auth/');
        if (!estAppelAuth && (err.status === 401 || err.status === 403) && auth.estExpiree()) {
          auth.sessionExpiree.set(true);
        }
      },
    }),
  );
};
