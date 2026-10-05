import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

  it('anime jusqu’à la valeur finale quand la bande entre dans la fenêtre', async () => {
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
    rappels[0]([{ isIntersecting: true }]);
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(deconnexions).toBeGreaterThanOrEqual(1);
    fixture.destroy();
  });
});
