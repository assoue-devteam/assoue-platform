import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CatalogueService } from './catalogue.service';
import { PanierService } from './panier.service';
import { Produit } from '../../shared/models/api';

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
});
