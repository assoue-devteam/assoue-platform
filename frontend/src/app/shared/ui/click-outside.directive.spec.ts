import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ClickOutsideDirective, estDefilementFermant } from './click-outside.directive';

@Component({
  standalone: true,
  imports: [ClickOutsideDirective],
  template: `
    <div id="panneau" [appClickOutsideEnabled]="ouvert()" (appClickOutside)="recus.push($event)">
      <button id="dedans" type="button">Dedans</button>
    </div>
    <button id="dehors" type="button">Dehors</button>
  `,
})
class HoteComponent {
  ouvert = signal(false);
  recus: (PointerEvent | KeyboardEvent)[] = [];
}

function pointerdownSur(cible: HTMLElement): void {
  cible.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
}

describe('ClickOutsideDirective', () => {
  function creer() {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
    const hote = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, hote, panneau: el.querySelector('#panneau')!, dedans: el.querySelector<HTMLElement>('#dedans')!, dehors: el.querySelector<HTMLElement>('#dehors')! };
  }

  it('émet au pointerdown hors de l’hôte, pas à l’intérieur', () => {
    const { fixture, hote, dedans, dehors } = creer();
    hote.ouvert.set(true);
    fixture.detectChanges();

    pointerdownSur(dedans);
    expect(hote.recus.length).toBe(0);

    pointerdownSur(dehors);
    expect(hote.recus.length).toBe(1);
    expect(hote.recus[0] instanceof PointerEvent).toBeTrue();
  });

  it('n’écoute le document que quand le panneau est ouvert', () => {
    const { hote, dehors } = creer();
    pointerdownSur(dehors);
    expect(hote.recus.length).toBe(0);
  });

  it('émet sur Échap', () => {
    const { fixture, hote } = creer();
    hote.ouvert.set(true);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(hote.recus.length).toBe(1);
    expect(hote.recus[0] instanceof KeyboardEvent).toBeTrue();
  });

  it('retire ses écouteurs à la fermeture et à la destruction', () => {
    const espionRetrait = spyOn(document, 'removeEventListener').and.callThrough();
    const { fixture, hote, dehors } = creer();
    hote.ouvert.set(true);
    fixture.detectChanges();
    hote.ouvert.set(false);
    fixture.detectChanges();
    expect(espionRetrait).toHaveBeenCalledWith('pointerdown', jasmine.any(Function), true);
    expect(espionRetrait).toHaveBeenCalledWith('keydown', jasmine.any(Function));

    hote.ouvert.set(true);
    fixture.detectChanges();
    fixture.destroy();
    const retraitsApresDestruction = espionRetrait.calls.allArgs().filter(args => args[0] === 'pointerdown').length;
    expect(retraitsApresDestruction).toBe(2);

    pointerdownSur(dehors);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(hote.recus.length).toBe(0);
  });
});

describe('estDefilementFermant', () => {
  function scrollSur(cible: EventTarget): Event {
    const event = new Event('scroll', { bubbles: false });
    cible.dispatchEvent(event);
    return event;
  }

  it('ignore le scroll qui vient de l’intérieur du panneau', () => {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
    const panneau = fixture.nativeElement.querySelector('#panneau') as HTMLElement;
    // Un scroll interne ne remonte pas à window : target = l’élément lui-même.
    expect(estDefilementFermant(scrollSur(panneau), panneau)).toBeFalse();
  });

  it('ignore le scroll de la page quand le focus est dans le panneau (clavier mobile)', () => {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const panneau = el.querySelector('#panneau') as HTMLElement;
    el.querySelector<HTMLElement>('#dedans')!.focus();
    // Propagation document → window : target = document.
    expect(estDefilementFermant(scrollSur(document), panneau)).toBeFalse();
    (document.activeElement as HTMLElement | null)?.blur?.();
    expect(estDefilementFermant(scrollSur(document), panneau)).toBeTrue();
  });
});
