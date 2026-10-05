import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CataloguePageComponent, lireCategorieParam, lireTriParam, normaliser, trierProduits } from './catalogue-page.component';
import { nettoyer } from './recherche-produit.component';
import { Categorie, Produit } from '../../shared/models/api';

const produit = (id: number, nom: string, categorie: string, prix = 1000): Produit =>
  ({ id, nom, categorie, description: '', prix, imageUrl: null, imageCle: null, enRupture: false, vedette: false, noteMoyenne: null, nombreAvis: 0 });

const categories: Categorie[] = [
  { id: 1, nom: 'Mobilier', description: null },
  { id: 2, nom: 'Bijoux', description: null },
];

describe('recherche du catalogue', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  it('normalise sans accents ni majuscules (nom ou catégorie)', () => {
    expect(normaliser('PNÉU')).toBe('pneu');
    expect('Pouf en pneu recyclé'.toLowerCase()).toContain('pneu');
  });

  it('lit le tri et la catégorie depuis l\u2019URL, avec repli sûr', () => {
    expect(lireTriParam('prix-asc')).toBe('prix-asc');
    expect(lireTriParam('prix-desc')).toBe('prix-desc');
    expect(lireTriParam('nouveautes')).toBe('nouveautes');
    expect(lireTriParam('injection')).toBe('pertinence');
    expect(lireTriParam(undefined)).toBe('pertinence');
    expect(lireCategorieParam('2', categories)).toBe(2);
    expect(lireCategorieParam('99', categories)).toBeNull();
    expect(lireCategorieParam('x', categories)).toBeNull();
    expect(lireCategorieParam(undefined, categories)).toBeNull();
  });

  it('trie prix croissant/décroissant et nouveautés (id décroissant)', () => {
    const liste = [produit(1, 'A', 'Mobilier', 8000), produit(2, 'B', 'Bijoux', 2500), produit(3, 'C', 'Mobilier', 15000)];
    expect(trierProduits(liste, 'prix-asc').map(p => p.id)).toEqual([2, 1, 3]);
    expect(trierProduits(liste, 'prix-desc').map(p => p.id)).toEqual([3, 1, 2]);
    expect(trierProduits(liste, 'nouveautes').map(p => p.id)).toEqual([3, 2, 1]);
    expect(trierProduits(liste, 'pertinence').map(p => p.id)).toEqual([1, 2, 3]);
  });

  it('nettoie le terme de recherche (espaces, vide ignoré)', () => {
    expect(nettoyer('  pneu   recyclé  ')).toBe('pneu recyclé');
    expect(nettoyer('   ')).toBe('');
  });

  it('affiche le compteur, le tri et les vedettes sur le catalogue complet', () => {
    const fixture = TestBed.createComponent(CataloguePageComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/categories').flush([]);
    http.expectOne('/api/produits').flush([
      { ...produit(1, 'Pouf en pneu recyclé', 'Mobilier'), vedette: true },
      produit(2, 'Collier perles de plastique', 'Bijoux'),
    ]);
    fixture.detectChanges();

    const texte: string = fixture.nativeElement.textContent;
    expect(texte).toContain('2 produits');
    expect(fixture.nativeElement.querySelector('.tri select')).toBeTruthy();
    const vedettes = () => [...fixture.nativeElement.querySelectorAll('.vedettes .carte h2')].map((h: HTMLElement) => h.textContent!.trim());
    expect(vedettes()).toEqual(['Pouf en pneu recyclé']);

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('.tri select');
    select.value = 'prix-asc';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(vedettes()).toEqual([]);
  });

  it('une image en erreur est remplacée par l\u2019emplacement neutre', () => {
    const fixture = TestBed.createComponent(CataloguePageComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/categories').flush([]);
    http.expectOne('/api/produits').flush([{ ...produit(1, 'Pouf', 'Mobilier'), imageUrl: 'https://x/invalide.jpg' }]);
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('.carte__media img');
    expect(img).toBeTruthy();
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.carte__media img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.carte__vide')).toBeTruthy();
  });
});
