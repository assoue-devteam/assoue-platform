import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Meta } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DONNEES_IMPACT, surtitreImpact } from './impact-donnees';
import { NotreImpactPageComponent } from './notre-impact-page.component';

describe('page Notre impact', () => {
  function creer() {
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(NotreImpactPageComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('affiche les chiffres de la plaquette dès le rendu, avant toute animation', () => {
    const { el } = creer();
    const chiffres = Array.from(el.querySelectorAll('.chiffre .num'))
      .map(num => (num.textContent ?? '').replace(/\s/g, ''));
    expect(chiffres).toEqual(['400670', '801', '1857', '5']);
  });

  it('expose chaque valeur finale aux lecteurs d’écran sans les intermédiaires', () => {
    const { el } = creer();
    const animes = Array.from(el.querySelectorAll('.chiffre app-compteur-anime'));
    expect(animes.length).toBe(4);
    expect(animes.every(anime => anime.getAttribute('aria-hidden') === 'true')).toBeTrue();
    const accessibles = Array.from(el.querySelectorAll('.chiffre .sr-only'))
      .map(span => (span.textContent ?? '').replace(/\s/g, ' '));
    expect(accessibles).toContain('400 670 pneus recyclés');
  });

  it('calcule « Depuis N ans » depuis l’année de création des données', () => {
    expect(surtitreImpact(DONNEES_IMPACT, 2026)).toBe('Depuis 8 ans au Burkina Faso');
    expect(surtitreImpact({ ...DONNEES_IMPACT, anneeCreation: 2025 }, 2026)).toBe('Depuis 1 an au Burkina Faso');
    const { el } = creer();
    expect(el.querySelector('.surtitre')!.textContent).toMatch(/Depuis \d+ an/);
    // Carte régions : même donnée que le 4e chiffre, liste des 5 régions.
    expect(el.querySelectorAll('.regions li').length).toBe(5);
  });

  it('garde l’ordre chronologique des distinctions et un seul h1', () => {
    const { el } = creer();
    expect(el.querySelectorAll('h1').length).toBe(1);
    expect(Array.from(el.querySelectorAll('.distinctions .num')).map(annee => annee.textContent)).toEqual(
      ['2022', '2023', '2024', '2025']);
    expect(el.querySelectorAll('h2').length).toBe(3);
  });

  it('mène à la boutique et expose une meta description', () => {
    const { el } = creer();
    expect(el.querySelector('.appel a')!.getAttribute('href')).toBe('/');
    const description = TestBed.inject(Meta).getTag("name='description'");
    expect(description?.content).toContain('pneus recyclés');
  });
});
