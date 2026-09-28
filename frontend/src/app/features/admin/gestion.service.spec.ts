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
});
