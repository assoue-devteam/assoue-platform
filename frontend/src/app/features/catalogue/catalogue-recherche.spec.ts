import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CataloguePageComponent } from './catalogue-page.component';
import { Produit } from '../../shared/models/api';

const produit = (id: number, nom: string, categorie: string): Produit =>
  ({ id, nom, categorie, description: '', prix: 1000, imageUrl: null, enRupture: false, vedette: false, noteMoyenne: null, nombreAvis: 0 });

describe('recherche du catalogue', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  it('filtre sans tenir compte des accents ni des majuscules, nom ou catégorie', () => {
    const fixture = TestBed.createComponent(CataloguePageComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/categories').flush([]);
    http.expectOne('/api/produits').flush([
      produit(1, 'Pouf en pneu recyclé', 'Mobilier'),
      produit(2, 'Collier perles de plastique', 'Bijoux'),
      produit(3, 'Sandales semelle pneu', 'Chaussures'),
    ]);
    fixture.detectChanges();

    const saisir = (texte: string) => {
      const champ: HTMLInputElement = fixture.nativeElement.querySelector('#recherche-produit');
      champ.value = texte;
      champ.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      return [...fixture.nativeElement.querySelectorAll('.carte h2')].map((h: HTMLElement) => h.textContent!.trim());
    };

    expect(saisir('PNÉU')).toEqual(['Pouf en pneu recyclé', 'Sandales semelle pneu']);
    expect(saisir('bijoux')).toEqual(['Collier perles de plastique']);
    expect(saisir('table')).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Aucun produit ne correspond à « table »');
  });

  it('montre les produits vedettes sur le catalogue complet, pas sous une recherche', () => {
    const fixture = TestBed.createComponent(CataloguePageComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/categories').flush([]);
    http.expectOne('/api/produits').flush([
      { ...produit(1, 'Pouf en pneu recyclé', 'Mobilier'), vedette: true },
      produit(2, 'Collier perles de plastique', 'Bijoux'),
    ]);
    fixture.detectChanges();
    const vedettes = () => [...fixture.nativeElement.querySelectorAll('.vedettes .carte h2')].map((h: HTMLElement) => h.textContent!.trim());
    expect(vedettes()).toEqual(['Pouf en pneu recyclé']);

    const champ: HTMLInputElement = fixture.nativeElement.querySelector('#recherche-produit');
    champ.value = 'pouf';
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(vedettes()).toEqual([]);
  });
});
