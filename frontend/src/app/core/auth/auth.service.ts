import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, Role } from '../../shared/models/api';

export interface Session {
  token: string;
  email: string;
  roles: Role[];
  expiration: number; // ms epoch, lu dans le claim exp du JWT
}

const CLE_STOCKAGE = 'assoue.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly session = signal<Session | null>(lireSessionStockee());
  readonly connecte = computed(() => this.session() !== null);
  readonly email = computed(() => this.session()?.email ?? null);
  // Passe à true quand une requête échoue avec un token expiré : AppComponent affiche la modale.
  readonly sessionExpiree = signal(false);

  connecter(requete: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, requete)
      .pipe(tap(reponse => this.ouvrirSession(reponse)));
  }

  inscrire(requete: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, requete)
      .pipe(tap(reponse => this.ouvrirSession(reponse)));
  }

  // Ne touche qu'à la session : la file hors ligne du collecteur a son propre stockage et doit survivre.
  deconnecter() {
    localStorage.removeItem(CLE_STOCKAGE);
    this.session.set(null);
    this.sessionExpiree.set(false);
  }

  estExpiree(maintenant = Date.now()): boolean {
    const session = this.session();
    return session !== null && session.expiration <= maintenant;
  }

  /** Token à envoyer, ou null si absent/expiré (le backend n'a pas de refresh, GAP-07). */
  tokenValide(): string | null {
    return this.session() && !this.estExpiree() ? this.session()!.token : null;
  }

  aRole(role: Role): boolean {
    return this.session()?.roles.includes(role) ?? false;
  }

  /** Espace d'arrivée après connexion : ADMIN > COLLECTEUR > CLIENT (DS §1). */
  espaceParDefaut(): string {
    if (this.aRole('ADMIN')) return '/gestion/collectes';
    if (this.aRole('COLLECTEUR')) return '/collecte';
    return '/';
  }

  private ouvrirSession(reponse: AuthResponse) {
    const expiration = lireExpiration(reponse.token);
    if (expiration === null) throw new Error('Token reçu illisible');
    const session: Session = { token: reponse.token, email: reponse.email, roles: reponse.roles, expiration };
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(session));
    this.session.set(session);
    this.sessionExpiree.set(false);
  }
}

export function lireExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(payload)).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function lireSessionStockee(): Session | null {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    return brut ? JSON.parse(brut) as Session : null;
  } catch {
    return null;
  }
}
