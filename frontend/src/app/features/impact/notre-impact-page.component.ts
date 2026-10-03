import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { IconName } from '../../shared/ui/icon/icons';

/**
 * Fait défiler un nombre de 0 à sa valeur quand il devient visible, une seule fois.
 * La valeur finale est déjà dans le DOM : sans observer ou avec « réduire les animations »,
 * le chiffre exact reste affiché.
 */
@Directive({ selector: '[appCompteur]', standalone: true })
export class CompteurDirective implements AfterViewInit {
  readonly appCompteur = input.required<number>();
  private el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.el.textContent = formater(this.appCompteur());
    if (typeof IntersectionObserver === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entrees => {
      if (!entrees.some(entree => entree.isIntersecting)) return;
      observer.disconnect();
      this.animer();
    }, { threshold: 0.5 });
    observer.observe(this.el);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private animer(): void {
    const cible = this.appCompteur();
    const debut = performance.now();
    const duree = 1600;
    let frame = 0;
    const pas = (maintenant: number) => {
      const progression = Math.min(1, (maintenant - debut) / duree);
      this.el.textContent = formater(Math.round(cible * (1 - Math.pow(1 - progression, 3))));
      if (progression < 1) frame = requestAnimationFrame(pas);
    };
    frame = requestAnimationFrame(pas);
    this.destroyRef.onDestroy(() => cancelAnimationFrame(frame));
  }
}

function formater(nombre: number): string {
  return nombre.toLocaleString('fr-FR');
}

// Chiffres, valeurs et distinctions de la plaquette AS'SOUÉ 2026.
const CHIFFRES = [
  { valeur: 400670, libelle: 'pneus recyclés' },
  { valeur: 801, libelle: 'emplois directs' },
  { valeur: 1857, libelle: 'emplois indirects' },
  { valeur: 5, libelle: "régions d'intervention" },
];

const MISSION: { icone: IconName; titre: string; texte: string }[] = [
  { icone: 'recycle', titre: 'Réduire la pollution', texte: "Chaque pneu collecté quitte un caniveau ou un terrain vague de nos quartiers pour devenir un objet utile." },
  { icone: 'shield-check', titre: 'Protéger la santé', texte: "Les pneus abandonnés retiennent l'eau de pluie et deviennent des gîtes à moustiques porteurs du paludisme." },
  { icone: 'users', titre: 'Créer des emplois', texte: "Nos artisans, en majorité des femmes et des jeunes formés dans nos ateliers, vivent de ce qu'ils fabriquent." },
];

const VALEURS = [
  { titre: 'Écoresponsabilité', texte: 'Produire sans détruire.' },
  { titre: "Partage de l'expertise", texte: 'Transmettre pour grandir ensemble.' },
  { titre: 'Intégration', texte: 'Ne laisser personne de côté.' },
  { titre: 'Résilience', texte: "Transformer l'obstacle en opportunité." },
];

const DISTINCTIONS = [
  { annee: 2022, titre: "Prix de l'entrepreneuriat innovant (OFEQ)" },
  { annee: 2023, titre: "Ambassadrice de l'environnement (Burkina) et de la Paix (Religion for Peace)" },
  { annee: 2024, titre: '1er Prix national Tremplin UEMOA' },
  { annee: 2025, titre: 'Prix féminin national au POESAM' },
];

@Component({
  standalone: true,
  imports: [RouterLink, ButtonDirective, IconComponent, CompteurDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="impact container">
      <header class="impact__intro">
        <p class="surtitre">Depuis 8 ans au Burkina Faso</p>
        <h1 class="display">L'art du recyclage pour un avenir durable</h1>
        <p class="text-muted">AS'SOUÉ est une entreprise sociale et écologique : elle transforme les pneus usagés et les sachets plastiques en meubles, chaussures et objets du quotidien, fabriqués par des artisans formés dans ses ateliers.</p>
      </header>

      <div class="chiffres">
        @for (chiffre of chiffres; track chiffre.libelle) {
          <div class="chiffre"><strong class="num" [appCompteur]="chiffre.valeur"></strong><span>{{ chiffre.libelle }}</span></div>
        }
      </div>
      <p class="source text-caption">Chiffres de la plaquette AS'SOUÉ 2026 · Centre, Centre-Nord, Hauts-Bassins, Est et Centre-Est.</p>

      <section class="bloc" aria-labelledby="titre-mission">
        <h2 id="titre-mission">Notre mission</h2>
        <div class="cartes">
          @for (item of mission; track item.titre) {
            <article class="carte">
              <span class="carte__icone"><app-icon [name]="item.icone" [size]="24" /></span>
              <h3>{{ item.titre }}</h3>
              <p class="text-muted">{{ item.texte }}</p>
            </article>
          }
        </div>
      </section>

      <section class="bloc" aria-labelledby="titre-valeurs">
        <h2 id="titre-valeurs">Nos valeurs</h2>
        <ul class="valeurs">
          @for (valeur of valeurs; track valeur.titre) {
            <li><strong>{{ valeur.titre }}</strong><span class="text-muted">{{ valeur.texte }}</span></li>
          }
        </ul>
      </section>

      <section class="bloc" aria-labelledby="titre-distinctions">
        <h2 id="titre-distinctions">Distinctions</h2>
        <ol class="distinctions">
          @for (distinction of distinctions; track distinction.annee) {
            <li><span class="num">{{ distinction.annee }}</span>{{ distinction.titre }}</li>
          }
        </ol>
      </section>

      <div class="appel">
        <p>Chaque achat soutient les artisans et retire des pneus de nos quartiers.</p>
        <a routerLink="/" appButton="primary">Découvrir la boutique</a>
      </div>
    </section>
  `,
  styles: `
    .impact { display: grid; gap: var(--space-6); padding-block: var(--space-7); }
    .impact__intro { display: grid; gap: var(--space-3); max-width: 680px; }
    .surtitre { font-size: 14px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--color-primary); }
    .chiffres {
      display: grid; gap: var(--space-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
      padding: var(--space-6) var(--space-5); border-radius: var(--radius-md);
      background: var(--color-surface-dark); color: var(--color-text-on-dark);
    }
    .chiffre { display: grid; gap: var(--space-1); }
    .chiffre strong { font-size: clamp(32px, 5vw, 44px); line-height: 1.05; font-weight: 600; color: var(--color-vif); }
    .chiffre span { color: rgba(255, 255, 255, .82); }
    .source { margin-top: calc(-1 * var(--space-4)); }
    .bloc { display: grid; gap: var(--space-4); }
    .cartes { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }
    .carte { display: grid; gap: var(--space-2); align-content: start; padding: var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); }
    .carte__icone { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--radius-full); background: var(--color-primary-tint); color: var(--color-primary-strong); }
    .valeurs { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); list-style: none; margin: 0; padding: 0; }
    .valeurs li { display: grid; gap: var(--space-1); padding-left: var(--space-3); border-left: 3px solid var(--color-vif); }
    .distinctions { display: grid; gap: var(--space-3); list-style: none; margin: 0; padding: 0; }
    .distinctions li { display: flex; gap: var(--space-4); align-items: baseline; }
    .distinctions span { flex: none; min-width: 48px; font-weight: 600; color: var(--color-primary); }
    .appel { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-5); border-radius: var(--radius-md); background: var(--color-primary-tint); }
    .appel p { font-weight: 600; }
  `,
})
export class NotreImpactPageComponent {
  protected readonly chiffres = CHIFFRES;
  protected readonly mission = MISSION;
  protected readonly valeurs = VALEURS;
  protected readonly distinctions = DISTINCTIONS;
}
