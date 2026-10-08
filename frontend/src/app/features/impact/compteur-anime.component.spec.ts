import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DUREE_COMPTEUR, valeurInterpolee } from '../../shared/compteur';
import { CompteurAnimeComponent } from './compteur-anime.component';

type RappelIntersection = (entrees: { isIntersecting: boolean }[]) => void;

@Component({
  standalone: true,
  imports: [CompteurAnimeComponent],
  template: `<app-compteur-anime [valeur]="valeur()" [duree]="duree()" [suffixe]="suffixe()" />`,
})
class HoteComponent {
  valeur = input(400670);
  duree = input(120);
  suffixe = input('');
}

describe('CompteurAnimeComponent', () => {
  let rappels: RappelIntersection[];
  let deconnexions = 0;
  let vraiObserver: typeof IntersectionObserver | undefined;
  let media: jasmine.Spy;

  const sansEspaces = (texte: string | null | undefined) => (texte ?? '').replace(/\s/g, '');

  beforeEach(() => {
    registerLocaleData(localeFr);
    // ChromeHeadless préfère la réduction des animations : on simule un mouvement normal,
    // sauf dans le test dédié qui réclame la valeur finale sans animation.
    media = spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    rappels = [];
    deconnexions = 0;
    vraiObserver = (window as unknown as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      constructor(private rappel: RappelIntersection) {
        rappels.push(rappel);
      }
      observe(): void {}
      disconnect(): void {
        deconnexions++;
      }
      unobserve(): void {}
    };
  });

  afterEach(() => {
    if (vraiObserver) {
      (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = vraiObserver;
    }
  });

  function texteCompteur(fixture: { nativeElement: HTMLElement }): string {
    return fixture.nativeElement.querySelector('app-compteur-anime')!.textContent ?? '';
  }

  it('affiche la valeur finale dès le rendu, avant tout déclenchement', () => {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
    expect(sansEspaces(texteCompteur(fixture))).toBe('400670');
    expect(rappels.length).toBe(1);
  });

  it('n’anime pas si l’élément est déjà visible au chargement (grand écran)', async () => {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
    // Premier rappel : visible au chargement → ignoré, on attend la sortie.
    rappels[0]([{ isIntersecting: true }]);
    expect(sansEspaces(texteCompteur(fixture))).toBe('400670');
    // Sortie du viewport → armé.
    rappels[0]([{ isIntersecting: false }]);
    expect(sansEspaces(texteCompteur(fixture))).toBe('400670');
    // Réentrée → l’animation démarre (valeur intermédiaire, pas la finale).
    rappels[0]([{ isIntersecting: true }]);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(sansEspaces(texteCompteur(fixture))).not.toBe('400670');
  });

  it('anime dès l’entrée réelle dans la fenêtre (mobile : élément d’abord hors écran)', async () => {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.componentRef.setInput('valeur', 801);
    fixture.detectChanges();
    rappels[0]([{ isIntersecting: false }]);
    rappels[0]([{ isIntersecting: true }]);
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(sansEspaces(texteCompteur(fixture))).toBe('801');
  });

  it('formate les milliers, ajoute le suffixe et gère la valeur 0', () => {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.componentRef.setInput('valeur', 0);
    fixture.componentRef.setInput('suffixe', ' kg');
    fixture.detectChanges();
    expect(texteCompteur(fixture)).toBe('0 kg');
  });

  it('sans animation avec « réduire les animations » : valeur finale, aucun observateur', () => {
    media.and.returnValue({ matches: true } as MediaQueryList);
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
    expect(sansEspaces(texteCompteur(fixture))).toBe('400670');
    expect(rappels.length).toBe(0);
  });

  it('déconnecte l’observateur après usage et à la destruction', async () => {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
    rappels[0]([{ isIntersecting: false }]);
    rappels[0]([{ isIntersecting: true }]);
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(deconnexions).toBeGreaterThanOrEqual(1);
    fixture.destroy();
  });
});

describe('valeurInterpolee', () => {
  it('est 0 au départ et la valeur cible à la fin', () => {
    expect(valeurInterpolee(400670, 0)).toBe(0);
    expect(valeurInterpolee(400670, 1)).toBe(400670);
  });

  it('suit une courbe ease-out (87,5 % du chemin à 50 % du temps)', () => {
    expect(valeurInterpolee(1000, 0.5)).toBe(875);
  });

  it('borne la progression entre 0 et 1', () => {
    expect(valeurInterpolee(100, -1)).toBe(0);
    expect(valeurInterpolee(100, 2)).toBe(100);
  });
});

describe('DUREE_COMPTEUR', () => {
  it('est comprise entre 1,6 et 2 secondes', () => {
    expect(DUREE_COMPTEUR).toBeGreaterThanOrEqual(1600);
    expect(DUREE_COMPTEUR).toBeLessThanOrEqual(2000);
  });
});
