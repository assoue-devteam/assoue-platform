import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, viewChild } from '@angular/core';
import { formaterNombreFr } from '../../shared/nombres';
import { DUREE_COMPTEUR, valeurInterpolee } from '../../shared/compteur';

/**
 * Compte de 0 jusqu'à `valeur` quand il entre dans la fenêtre (une seule fois).
 * requestAnimationFrame + ease-out cubic : la valeur vient du temps écoulé, pas
 * d'un setInterval. La valeur finale est déjà dans le DOM (sans observer ou avec
 * « réduire les animations », le chiffre exact reste affiché) ; le conteneur
 * porte aria-hidden et la valeur accessible est fournie à côté (texte masqué).
 *
 * Déclenchement : si l'élément est déjà visible au chargement (cas fréquent sur
 * grand écran), le premier rappel de l'observer est ignoré — l'animation ne se
 * lance qu'après une sortie du viewport, pour ne pas se terminer avant que
 * l'utilisateur ne regarde la zone. Sur mobile (élément plus bas), le
 * déclenchement est naturel à l'arrivée au scroll.
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
  readonly duree = input(DUREE_COMPTEUR);
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

    // « pret » passe à true dès que l'élément sort du viewport : l'animation ne
    // se lance qu'à une entrée réelle, jamais au chargement initial.
    let pret = false;
    const observateur = new IntersectionObserver(entrees => {
      const entree = entrees[entrees.length - 1];
      if (!entree.isIntersecting) {
        pret = true;
        return;
      }
      if (!pret) return;
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
      el.textContent = formaterNombreFr(valeurInterpolee(cible, progression)) + suffixe;
      if (progression < 1) this.trame = requestAnimationFrame(pas);
    };
    this.trame = requestAnimationFrame(pas);
    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.trame));
  }
}
