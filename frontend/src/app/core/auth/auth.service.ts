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

/**
 * « Se souvenir de moi » est un comportement uniquement front (aucun refresh token côté backend,
 * GAP-07) : coché, la session va dans localStorage (survit au redémarrage) ; décoché, dans
 * sessionStorage (vidé à la fermeture de l'onglet). Un seul lecteur lit les deux emplacements.
 *
 * Note sécurité : tout stockage navigateur du JWT l'expose au vol par XSS. En contrepartie,
 * l'application n'injecte jamais de HTML non échappé (interpolation Angular uniquement, pas de
 * innerHTML sur des données serveur) et le backend reste l'autorité (le claim exp n'est lu
 * côté front que pour l'UX : déconnexion automatique à l'expiration).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly session = signal<Session | null>(lireSessionStockee());
  readonly connecte = computed(() => this.session() !== null);
  readonly email = computed(() => this.session()?.email ?? null);
  // Passe à true quand une requête échoue avec un token expiré : AppComponent affiche la modale.
  readonly sessionExpiree = signal(false);

  connecter(requete: LoginRequest, seSouvenir = true): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, requete)
      .pipe(tap(reponse => this.ouvrirSession(reponse, seSouvenir)));
  }

  inscrire(requete: RegisterRequest, seSouvenir = true): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, requete)
      .pipe(tap(reponse => this.ouvrirSession(reponse, seSouvenir)));
  }

  // Ne touche qu'à la session : la file hors ligne du collecteur a son propre stockage et doit survivre.
  deconnecter() {
    localStorage.removeItem(CLE_STOCKAGE);
    sessionStorage.removeItem(CLE_STOCKAGE);
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

  private ouvrirSession(reponse: AuthResponse, seSouvenir: boolean) {
    const expiration = lireExpiration(reponse.token);
    if (expiration === null) throw new Error('Token reçu illisible');
    const session: Session = { token: reponse.token, email: reponse.email, roles: reponse.roles, expiration };
    // On vide l'autre emplacement : une seule session à la fois, pas de doublon persistant/session.
    if (seSouvenir) {
      sessionStorage.removeItem(CLE_STOCKAGE);
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(session));
    } else {
      localStorage.removeItem(CLE_STOCKAGE);
      sessionStorage.setItem(CLE_STOCKAGE, JSON.stringify(session));
    }
    this.session.set(session);
    this.sessionExpiree.set(false);
  }
}

export function lireExpiration(token: string): number | null {
  try {
    const brut = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const complete = brut + '='.repeat((4 - (brut.length % 4)) % 4);
    const exp = JSON.parse(atob(complete)).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function lireSessionStockee(): Session | null {
  for (const stockage of [localStorage, sessionStorage]) {
    try {
      const brut = stockage.getItem(CLE_STOCKAGE);
      if (brut) return JSON.parse(brut) as Session;
    } catch {
      // Entrée corrompue : on l'ignore et on essaie l'autre emplacement.
    }
  }
  return null;
}
