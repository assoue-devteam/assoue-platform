import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CatalogueService } from './catalogue.service';
import { PanierService } from './panier.service';
import { Produit } from '../../shared/models/api';
import { AuthService } from '../../core/auth/auth.service';

const produit: Produit = {
  id: 7, nom: 'Bracelet recyclé', description: 'Un bracelet.', prix: 2500,
  imageUrl: null, categorie: 'Bijoux', enRupture: false,
};

describe('catalogue et panier', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('appelle les endpoints publics du catalogue', () => {
    const service = TestBed.inject(CatalogueService);
    const http = TestBed.inject(HttpTestingController);
    service.categories().subscribe();
    service.produits().subscribe();
    service.produits(3).subscribe();
    service.produit(7).subscribe();
    const categories = http.expectOne('/api/categories');
    const produits = http.expectOne('/api/produits');
    const produitsFiltres = http.expectOne('/api/produits?categorieId=3');
    const fiche = http.expectOne('/api/produits/7');
    expect(categories.request.method).toBe('GET');
    expect(produits.request.method).toBe('GET');
    expect(produitsFiltres.request.method).toBe('GET');
    expect(fiche.request.method).toBe('GET');
    categories.flush([]);
    produits.flush([]);
    produitsFiltres.flush([]);
    fiche.flush(produit);
  });

  it('persiste le panier, additionne une ligne identique et recalcule le total', () => {
    const panier = TestBed.inject(PanierService);
    panier.ajouter(produit);
    panier.ajouter(produit);
    expect(panier.nombreArticles()).toBe(2);
    expect(panier.total()).toBe(5000);
    expect(JSON.parse(localStorage.getItem('assoue.panier')!)[0].quantite).toBe(2);
    panier.definirQuantite(produit.id, 0);
    expect(panier.lignes()).toEqual([]);
  });

  it('refuse une addition en rupture', () => {
    const panier = TestBed.inject(PanierService);
    panier.ajouter({ ...produit, enRupture: true });
    expect(panier.lignes()).toEqual([]);
  });

  describe('propriétaire du panier', () => {
    const connecter = (email: string) => {
      TestBed.inject(AuthService).session.set({ token: 't', email, roles: ['CLIENT'], expiration: Date.now() + 60_000 });
      TestBed.tick();
    };

    it('conserve le panier du visiteur à sa connexion', () => {
      const panier = TestBed.inject(PanierService);
      TestBed.tick();
      panier.ajouter(produit);
      connecter('awa@assoue.bf');
      expect(panier.nombreArticles()).toBe(1);
    });

    it('masque le panier à la déconnexion et le rend à la reconnexion', () => {
      const panier = TestBed.inject(PanierService);
      connecter('awa@assoue.bf');
      panier.ajouter(produit);
      TestBed.inject(AuthService).deconnecter();
      TestBed.tick();
      expect(panier.lignes()).toEqual([]);
      connecter('awa@assoue.bf');
      expect(panier.nombreArticles()).toBe(1);
    });

    it('ne montre pas le panier d\'un compte à un autre compte', () => {
      const panier = TestBed.inject(PanierService);
      connecter('awa@assoue.bf');
      panier.ajouter(produit);
      connecter('issa@assoue.bf');
      expect(panier.lignes()).toEqual([]);
    });

    it('additionne le panier visiteur à celui du compte', () => {
      localStorage.setItem('assoue.panier.awa@assoue.bf', JSON.stringify([{ produit, quantite: 2 }]));
      const panier = TestBed.inject(PanierService);
      TestBed.tick();
      panier.ajouter(produit);
      connecter('awa@assoue.bf');
      expect(panier.nombreArticles()).toBe(3);
      expect(localStorage.getItem('assoue.panier')).toBeNull();
    });

    it('lit le panier du compte déjà connecté au démarrage', () => {
      localStorage.setItem('assoue.session', JSON.stringify({ token: 't', email: 'awa@assoue.bf', roles: ['CLIENT'], expiration: Date.now() + 60_000 }));
      localStorage.setItem('assoue.panier.awa@assoue.bf', JSON.stringify([{ produit, quantite: 2 }]));
      const panier = TestBed.inject(PanierService);
      TestBed.tick();
      expect(panier.nombreArticles()).toBe(2);
    });
  });
});
