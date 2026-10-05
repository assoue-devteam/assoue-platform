import { DestroyRef, Directive, ElementRef, effect, inject, input, output } from '@angular/core';

/**
 * Ferme un panneau flottant (menu compte, menu burger, recherche mobile, sidebar gestion)
 * quand l'utilisateur agit en dehors : pointerdown hors de l'élément hôte, ou touche Échap.
 *
 * Pas d'Angular CDK dans le projet (voir package.json) : son Overlay serait disproportionné
 * pour de simples panneaux ancrés, d'où cette directive maison d'une vingtaine de lignes.
 *
 * Les écouteurs document ne sont posés que quand le panneau est ouvert
 * (`appClickOutsideEnabled`) et sont retirés à la fermeture et à la destruction.
 * `pointerdown` (et non `click`) couvre souris et tactile ; la capture garantit de voir
 * l'événement même si un enfant fait stopPropagation. L'événement d'origine est réémis
 * pour que le composant rende le focus au déclencheur sur Échap, mais pas après un
 * pointerdown (le pointeur a déjà choisi sa cible).
 */
@Directive({ selector: '[appClickOutside]', standalone: true })
export class ClickOutsideDirective {
  readonly appClickOutside = output<PointerEvent | KeyboardEvent>();
  readonly appClickOutsideEnabled = input(true);

  private hote = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private destroyRef = inject(DestroyRef);
  private detacher: (() => void) | null = null;

  constructor() {
    effect(() => {
      if (this.appClickOutsideEnabled()) this.attacher();
      else this.detacherEcouteurs();
    });
    this.destroyRef.onDestroy(() => this.detacherEcouteurs());
  }

  private attacher(): void {
    if (this.detacher) return;
    const auPointeur = (event: PointerEvent) => {
      if (!this.hote.contains(event.target as Node)) this.appClickOutside.emit(event);
    };
    const auClavier = (event: KeyboardEvent) => {
      if (event.key === 'Escape') this.appClickOutside.emit(event);
    };
    document.addEventListener('pointerdown', auPointeur, true);
    document.addEventListener('keydown', auClavier);
    this.detacher = () => {
      document.removeEventListener('pointerdown', auPointeur, true);
      document.removeEventListener('keydown', auClavier);
    };
  }

  private detacherEcouteurs(): void {
    this.detacher?.();
    this.detacher = null;
  }
}
