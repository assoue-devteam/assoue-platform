import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CollecteService } from './collecte.service';

describe('CollecteService', () => {
  let service: CollecteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CollecteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('charge les matériaux et l’historique du collecteur', () => {
    service.materiaux().subscribe();
    service.mesCollectes().subscribe();
    expect(http.expectOne('/api/collectes/materiaux').request.method).toBe('GET');
    expect(http.expectOne('/api/collectes/mes-collectes').request.method).toBe('GET');
  });

  it('envoie une déclaration avec sa référence client', () => {
    const requete = { referenceClient: 'offline-1', materiauId: 1, quantiteEstimee: 12.5, localisation: { lat: 12.3, lng: -1.5 } };
    service.enregistrer(requete).subscribe();
    const appel = http.expectOne('/api/collectes');
    expect(appel.request.method).toBe('POST');
    expect(appel.request.body).toEqual(requete);
    appel.flush({ id: 4, ...requete, statut: 'DECLAREE', dateDeclaration: '2026-09-28T10:00:00', latitude: 12.3, longitude: -1.5, lignes: [] });
  });
});
