import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Produit } from '../../shared/models/api';
import { ToastService } from '../../shared/ui/toast';
import { FavorisService } from './favoris.service';

const pouf: Produit = { id: 4, nom: 'Pouf', description: '', prix: 25000, imageUrl: null, imageCle: null, categorie: 'Mobilier', enRupture: false, vedette: false, noteMoyenne: null, nombreAvis: 0 };

describe('favoris', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const connecterClient = () => {
    TestBed.inject(AuthService).session.set({ token: 't', email: 'awa@assoue.bf', roles: ['CLIENT'], expiration: Date.now() + 60_000 });
    TestBed.tick();
  };

  it('charge les favoris du client à sa connexion', () => {
    const favoris = TestBed.inject(FavorisService);
    connecterClient();
    http.expectOne({ method: 'GET', url: '/api/favoris' }).flush([pouf]);
    expect(favoris.estFavori(4)).toBeTrue();
  });

  it('bascule tout de suite et revient en arrière si le serveur refuse', () => {
    const favoris = TestBed.inject(FavorisService);
    connecterClient();
    http.expectOne('/api/favoris').flush([]);

    favoris.basculer(pouf);
    expect(favoris.estFavori(4)).toBeTrue();
    http.expectOne({ method: 'PUT', url: '/api/favoris/4' }).flush({ statut: 404, message: 'Produit introuvable : 4' }, { status: 404, statusText: 'Not Found' });
    expect(favoris.estFavori(4)).toBeFalse();
    expect(TestBed.inject(ToastService).toasts()[0].message).toContain('Produit introuvable');
  });

  it('retire un favori existant', () => {
    const favoris = TestBed.inject(FavorisService);
    connecterClient();
    http.expectOne('/api/favoris').flush([pouf]);
    favoris.basculer(pouf);
    http.expectOne({ method: 'DELETE', url: '/api/favoris/4' }).flush(null);
    expect(favoris.produits()).toEqual([]);
  });

  it('envoie le visiteur se connecter sans appeler le serveur', () => {
    const favoris = TestBed.inject(FavorisService);
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    TestBed.tick();
    favoris.basculer(pouf);
    expect(navigate).toHaveBeenCalledWith(['/connexion'], { queryParams: { retour: '/' } });
  });

  it('vide les favoris à la déconnexion', () => {
    const favoris = TestBed.inject(FavorisService);
    connecterClient();
    http.expectOne('/api/favoris').flush([pouf]);
    TestBed.inject(AuthService).deconnecter();
    TestBed.tick();
    expect(favoris.produits()).toEqual([]);
  });
});
