import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MotDePasseOublieService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  demanderCode(email: string) {
    return this.http.post<{ message: string }>(`${this.api}/auth/mot-de-passe-oublie/demande`, { email });
  }

  verifierCode(email: string, code: string) {
    return this.http.post<{ jeton: string }>(`${this.api}/auth/mot-de-passe-oublie/verification`, { email, code });
  }

  reinitialiser(jeton: string, nouveauMotDePasse: string) {
    return this.http.post<void>(`${this.api}/auth/mot-de-passe-oublie/reinitialisation`, { jeton, nouveauMotDePasse });
  }
}
