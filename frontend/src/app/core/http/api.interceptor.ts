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
        // Sans AuthenticationEntryPoint, le backend renvoie 403 (pas 401) pour un token expiré :
        // on distingue par la date d'expiration lue dans le JWT, pas par le code HTTP (GAP-07).
        if ((err.status === 401 || err.status === 403) && auth.estExpiree()) {
          auth.sessionExpiree.set(true);
        }
      },
    }),
  );
};
