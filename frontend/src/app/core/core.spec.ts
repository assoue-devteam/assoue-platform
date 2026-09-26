import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService, lireExpiration } from './auth/auth.service';
import { apiInterceptor } from './http/api.interceptor';
import { roleGuard } from './auth/guards';
import { messageErreur } from './http/erreurs';
import { HttpErrorResponse } from '@angular/common/http';
import { Role } from '../shared/models/api';

function jwt(expSecondes: number): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256' })}.${b64({ sub: 'awa@example.com', exp: expSecondes })}.signature`;
}

const dansUneHeure = () => Math.floor(Date.now() / 1000) + 3600;
const ilYaUneHeure = () => Math.floor(Date.now() / 1000) - 3600;

describe('socle core', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiInterceptor])), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function seConnecter(roles: Role[], exp = dansUneHeure()) {
    auth.connecter({ email: 'awa@example.com', motDePasse: 'secret123' }).subscribe();
    http.expectOne('/api/auth/login').flush({ token: jwt(exp), email: 'awa@example.com', roles });
  }

  it('lit exp dans le JWT (base64url)', () => {
    expect(lireExpiration(jwt(1_800_000_000))).toBe(1_800_000_000_000);
    expect(lireExpiration('pas-un-jwt')).toBeNull();
  });

  it('ouvre et conserve la session à la connexion', () => {
    seConnecter(['CLIENT']);
    expect(auth.connecte()).toBeTrue();
    expect(auth.email()).toBe('awa@example.com');
    expect(JSON.parse(localStorage.getItem('assoue.session')!).roles).toEqual(['CLIENT']);
  });

  it('choisit l\'espace ADMIN > COLLECTEUR > CLIENT', () => {
    seConnecter(['CLIENT', 'COLLECTEUR']);
    expect(auth.espaceParDefaut()).toBe('/collecte');
    seConnecter(['CLIENT', 'ADMIN', 'COLLECTEUR']);
    expect(auth.espaceParDefaut()).toBe('/gestion/collectes');
  });

  it('ajoute le token Bearer aux appels API, pas aux autres', () => {
    seConnecter(['CLIENT']);
    const client = TestBed.inject(HttpClient);
    client.get('/api/commandes/mes-commandes').subscribe();
    client.get('/assets/x.json').subscribe();

    expect(http.expectOne('/api/commandes/mes-commandes').request.headers.get('Authorization')).toMatch(/^Bearer /);
    expect(http.expectOne('/assets/x.json').request.headers.has('Authorization')).toBeFalse();
  });

  it('n\'envoie pas un token expiré et signale la session expirée sur 403', () => {
    seConnecter(['CLIENT'], ilYaUneHeure());
    TestBed.inject(HttpClient).get('/api/commandes/mes-commandes').subscribe({ error: () => {} });

    const req = http.expectOne('/api/commandes/mes-commandes');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush(null, { status: 403, statusText: 'Forbidden' });
    expect(auth.sessionExpiree()).toBeTrue();
  });

  it('un 403 avec une session valide n\'est pas une expiration (mauvais rôle)', () => {
    seConnecter(['CLIENT']);
    TestBed.inject(HttpClient).get('/api/utilisateurs').subscribe({ error: () => {} });
    http.expectOne('/api/utilisateurs').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(auth.sessionExpiree()).toBeFalse();
  });

  it('la déconnexion ne touche pas aux autres données locales (file collecteur)', () => {
    seConnecter(['COLLECTEUR']);
    localStorage.setItem('autre-cle', 'x');
    auth.deconnecter();
    expect(auth.connecte()).toBeFalse();
    expect(localStorage.getItem('autre-cle')).toBe('x');
  });

  describe('roleGuard', () => {
    const lancer = (url: string) =>
      TestBed.runInInjectionContext(() => roleGuard('ADMIN')({} as never, { url } as never));
    const cible = (r: unknown) => TestBed.inject(Router).serializeUrl(r as UrlTree);

    it('renvoie vers la connexion avec l\'URL de retour', () => {
      expect(cible(lancer('/gestion/stocks'))).toBe('/connexion?retour=%2Fgestion%2Fstocks');
    });

    it('précise la raison quand la session a expiré', () => {
      seConnecter(['ADMIN'], ilYaUneHeure());
      expect(cible(lancer('/gestion/stocks'))).toBe('/connexion?retour=%2Fgestion%2Fstocks&raison=expiree');
    });

    it('refuse un rôle absent et laisse passer le bon', () => {
      seConnecter(['CLIENT']);
      expect(cible(lancer('/gestion'))).toBe('/acces-refuse');
      seConnecter(['ADMIN']);
      expect(lancer('/gestion')).toBeTrue();
    });
  });

  it('messageErreur affiche le message métier du backend et masque les 5xx', () => {
    const e400 = new HttpErrorResponse({ status: 400, error: { statut: 400, message: 'Produit en rupture de stock : Sandales', horodatage: '' } });
    expect(messageErreur(e400)).toBe('Produit en rupture de stock : Sandales');
    expect(messageErreur(new HttpErrorResponse({ status: 0 }))).toContain('Pas de connexion');
    expect(messageErreur(new HttpErrorResponse({ status: 500, error: { message: 'NullPointerException' } }))).not.toContain('NullPointer');
  });
});
