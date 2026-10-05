import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { GestionService } from './gestion.service';
import { champErreurProduit, entierNonNegatif, versRequeteProduit } from './gestion-produits-page.component';
import { Produit } from '../../shared/models/api';

const produit: Produit = {
  id: 3, nom: 'Tabouret', description: null, prix: 12000, imageUrl: null, imageCle: null,
  categorie: 'Mobilier', enRupture: true, vedette: false, noteMoyenne: null, nombreAvis: 0,
};

describe('gestion des produits', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('appelle les endpoints CRUD du catalogue avec le bon verbe', () => {
    const service = TestBed.inject(GestionService);
    const http = TestBed.inject(HttpTestingController);
    const corps = { nom: 'Tabouret', categorieId: 1, prix: 12000, description: null, imageUrl: null, imageCle: null, stockQuantite: 5, vedette: false };

    service.creerProduit(corps).subscribe();
    service.modifierProduit(3, corps).subscribe();
    service.supprimerProduit(3).subscribe();

    const creation = http.expectOne({ method: 'POST', url: '/api/produits' });
    expect(creation.request.body).toEqual(corps);
    creation.flush(produit);
    const modification = http.expectOne({ method: 'PUT', url: '/api/produits/3' });
    expect(modification.request.body).toEqual(corps);
    modification.flush(produit);
    http.expectOne({ method: 'DELETE', url: '/api/produits/3' }).flush(null);
  });

  it('convertit le formulaire en requête (vide vers null, prix entier, clé image prioritaire)', () => {
    expect(versRequeteProduit({ nom: '  Tabouret ', categorieId: 1, prix: 12000, description: '', stockQuantite: null, vedette: true }, { cle: null, legacy: null }))
      .toEqual({ nom: 'Tabouret', categorieId: 1, prix: 12000, description: null, imageUrl: null, imageCle: null, stockQuantite: null, vedette: true });
    expect(versRequeteProduit({ nom: 'T', categorieId: 2, prix: 0, description: 'd', stockQuantite: 7, vedette: false }, { cle: 'cle-1.jpg', legacy: 'https://x/y.jpg' }).prix).toBe(0);
    // Clé téléversée : elle l'emporte, l'URL legacy est vidée.
    expect(versRequeteProduit({ nom: 'T', categorieId: 2, prix: 0, description: '', stockQuantite: null, vedette: false }, { cle: 'cle-1.jpg', legacy: 'https://x/y.jpg' }))
      .toEqual({ nom: 'T', categorieId: 2, prix: 0, description: null, imageUrl: null, imageCle: 'cle-1.jpg', stockQuantite: null, vedette: false });
    // Sans téléversement : l'URL legacy est reconduite telle quelle.
    expect(versRequeteProduit({ nom: 'T', categorieId: 2, prix: 0, description: '', stockQuantite: null, vedette: false }, { cle: null, legacy: 'https://x/y.jpg' }).imageUrl)
      .toBe('https://x/y.jpg');
  });

  it('n\u2019accepte que des prix et stocks entiers à 0 ou plus', () => {
    expect(entierNonNegatif(new FormControl(5))).toBeNull();
    expect(entierNonNegatif(new FormControl(0))).toBeNull();
    expect(entierNonNegatif(new FormControl(null))).toBeNull();
    expect(entierNonNegatif(new FormControl(12.5))).toEqual({ entier: true });
    expect(entierNonNegatif(new FormControl(-1))).toEqual({ entier: true });
  });

  it('rattache les 400 au bon champ, le reste en alerte haute', () => {
    expect(champErreurProduit(400, 'Le prix doit être positif')).toBe('prix');
    expect(champErreurProduit(400, 'Catégorie introuvable : 99')).toBe('categorieId');
    // Erreur d'image : alerte haute, le téléversement n'a pas de champ texte.
    expect(champErreurProduit(400, "Référence d'image invalide")).toBeNull();
    expect(champErreurProduit(400, 'contrainte inattendue')).toBeNull();
    expect(champErreurProduit(404, 'Produit introuvable : 3')).toBeNull();
  });
});
