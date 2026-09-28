import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const auth = inject(AuthService);
  const token = auth.tokenValide();
  const requete = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requete).pipe(
    catchError((err: HttpErrorResponse) => {
      // Sans AuthenticationEntryPoint, le backend renvoie 403 (pas 401) pour un token expiré :
      // on distingue par la date d'expiration lue dans le JWT, pas par le code HTTP (GAP-07).
      if ((err.status === 401 || err.status === 403) && auth.estExpiree()) {
        auth.sessionExpiree.set(true);
      }
      return throwError(() => err);
    }),
  );
};
