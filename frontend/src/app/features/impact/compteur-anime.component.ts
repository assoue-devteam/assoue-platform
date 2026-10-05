import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, viewChild } from '@angular/core';
import { formaterNombreFr } from '../../shared/nombres';

/**
 * Compte de 0 jusqu'à `valeur` quand il entre dans la fenêtre (une seule fois).
 * requestAnimationFrame + ease-out cubic : la valeur vient du temps écoulé, pas
 * d'un setInterval. La valeur finale est déjà dans le DOM (sans observer ou avec
 * « réduire les animations », le chiffre exact reste affiché) ; le conteneur
 * porte aria-hidden et la valeur accessible est fournie à côté (texte masqué).
 * Utilisé par « Notre impact » et les chiffres de la page Communauté.
 */
@Component({
  selector: 'app-compteur-anime',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-hidden]': 'true' },
  template: `<span #cible class="compteur">{{ formater(valeur()) }}{{ suffixe() }}</span>`,
  styles: `
    :host { display: block; font-variant-numeric: tabular-nums; }
    .compteur { display: inline-block; min-width: 8ch; font-variant-numeric: tabular-nums; }
  `,
})
export class CompteurAnimeComponent implements AfterViewInit {
  readonly valeur = input.required<number>();
  readonly duree = input(1600);
  readonly suffixe = input('');

  protected readonly formater = formaterNombreFr;
  private cible = viewChild<ElementRef<HTMLElement>>('cible');
  private destroyRef = inject(DestroyRef);
  private observateur: IntersectionObserver | null = null;
  private trame = 0;

  ngAfterViewInit(): void {
    const el = this.cible()?.nativeElement;
    if (!el) return;
    el.textContent = formaterNombreFr(this.valeur()) + this.suffixe();
    if (typeof IntersectionObserver === 'undefined'
      || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observateur = new IntersectionObserver(entrees => {
      if (!entrees.some(entree => entree.isIntersecting)) return;
      this.observateur?.disconnect();
      this.observateur = null;
      this.animer(el);
    }, { threshold: 0.35 });
    this.observateur = observateur;
    observateur.observe(el);
    this.destroyRef.onDestroy(() => {
      observateur.disconnect();
      cancelAnimationFrame(this.trame);
    });
  }

  private animer(el: HTMLElement): void {
    const cible = this.valeur();
    const suffixe = this.suffixe();
    const debut = performance.now();
    const duree = this.duree();
    const pas = (maintenant: number) => {
      const progression = Math.min(1, (maintenant - debut) / duree);
      const valeur = Math.round(cible * (1 - Math.pow(1 - progression, 3)));
      el.textContent = formaterNombreFr(valeur) + suffixe;
      if (progression < 1) this.trame = requestAnimationFrame(pas);
    };
    this.trame = requestAnimationFrame(pas);
    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.trame));
  }
}
