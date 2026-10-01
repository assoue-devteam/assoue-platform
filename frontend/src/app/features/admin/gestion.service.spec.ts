import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GestionService } from './gestion.service';

describe('GestionService', () => {
  let service: GestionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GestionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('utilise les endpoints de gestion existants', () => {
    service.collectes('DECLAREE').subscribe();
    service.commandesEnAttente().subscribe();
    service.stocksProduits().subscribe();
    service.utilisateurs().subscribe();
    expect(http.expectOne(request => request.url === '/api/collectes' && request.params.get('statut') === 'DECLAREE')).toBeTruthy();
    expect(http.expectOne('/api/commandes/en-attente').request.method).toBe('GET');
    expect(http.expectOne('/api/stocks/produits').request.method).toBe('GET');
    expect(http.expectOne('/api/utilisateurs').request.method).toBe('GET');
  });

  it('crée un utilisateur avec son rôle et remplace les rôles existants', () => {
    service.creerUtilisateur({ email: 'nouveau@example.com', motDePasse: 'secret123', roles: ['COLLECTEUR'] }).subscribe();
    const creation = http.expectOne('/api/utilisateurs');
    expect(creation.request.method).toBe('POST');
    expect(creation.request.body).toEqual({ email: 'nouveau@example.com', motDePasse: 'secret123', roles: ['COLLECTEUR'] });
    creation.flush({ id: 7, email: 'nouveau@example.com', nom: '', prenom: '', verrouille: false, roles: ['COLLECTEUR'] });

    service.remplacerRoles(7, ['ADMIN']).subscribe();
    const roles = http.expectOne('/api/utilisateurs/7/roles');
    expect(roles.request.method).toBe('PUT');
    expect(roles.request.body).toEqual({ roles: ['ADMIN'] });
    roles.flush({ id: 7, email: 'nouveau@example.com', nom: '', prenom: '', verrouille: false, roles: ['ADMIN'] });
  });
});
