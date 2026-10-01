import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { CollecteStoreService } from './collecte-store.service';
import { CollecteService } from './collecte.service';
import { positionManuelleValide } from './collecte-form-page.component';

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

  it('hors ligne : stocke la déclaration localement sans appel réseau', async () => {
    const store = TestBed.inject(CollecteStoreService);
    window.dispatchEvent(new Event('offline'));
    const requete = { referenceClient: 'hors-ligne-1', materiauId: 1, quantiteEstimee: 12.5, localisation: { lat: 12.3, lng: -1.5 } };

    const resultat = await firstValueFrom(service.enregistrer(requete));

    expect(resultat).toBeNull();
    http.expectNone('/api/collectes');
    expect((await store.enAttente()).length).toBe(1);
    await store.supprimer('hors-ligne-1');
  });

  it('resynchronise la file locale au retour du réseau', async () => {
    const store = TestBed.inject(CollecteStoreService);
    await store.enregistrer({ referenceClient: 'hors-ligne-2', materiauId: 2, quantiteEstimee: 8, localisation: { lat: 12.3, lng: -1.5 }, creeeLe: new Date().toISOString() });
    const tache = lastValueFrom(service.synchroniser());
    await new Promise(resolve => setTimeout(resolve, 50));

    const appel = http.expectOne('/api/collectes');
    expect(appel.request.method).toBe('POST');
    expect(appel.request.body).toEqual({ referenceClient: 'hors-ligne-2', materiauId: 2, quantiteEstimee: 8, localisation: { lat: 12.3, lng: -1.5 } });
    appel.flush({ id: 9 });

    expect(await tache).toBe(1);
    expect((await store.enAttente()).length).toBe(0);
  });
});

describe('position manuelle', () => {
  it('accepte les décimaux (point ou virgule) et refuse vide, texte et hors bornes', () => {
    expect(positionManuelleValide('12.3714', '-1.5197')).toEqual({ lat: 12.3714, lng: -1.5197 });
    expect(positionManuelleValide('12,3714', '-1,5197')).toEqual({ lat: 12.3714, lng: -1.5197 });
    expect(positionManuelleValide('', '')).toBeNull();
    expect(positionManuelleValide('abc', '0')).toBeNull();
    expect(positionManuelleValide('95', '0')).toBeNull();
    expect(positionManuelleValide('12', '200')).toBeNull();
  });
});
