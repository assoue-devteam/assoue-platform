import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { formaterNombreFr } from '../../shared/nombres';
import { CompteurAnimeComponent } from './compteur-anime.component';
import { DONNEES_IMPACT, surtitreImpact } from './impact-donnees';

// PUB-05 : chiffres, mission, valeurs et distinctions de la plaquette, mis en page
// comme le catalogue (même conteneur, mêmes marges). Le bouton mène à "/" : c'est
// la route réelle du catalogue (écart avec le DS §8 qui écrit "/catalogue", signalé).
@Component({
  standalone: true,
  imports: [RouterLink, ButtonDirective, IconComponent, CompteurAnimeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="impact container">
      <header class="impact__intro">
        <div class="impact__texte">
          <p class="surtitre">{{ surtitre }}</p>
          <h1 class="display">L'art du recyclage pour un avenir durable</h1>
          <p class="text-muted">AS'SOUÉ est une entreprise sociale et écologique : elle transforme les pneus usagés et les sachets plastiques en meubles, chaussures et objets du quotidien, fabriqués par des artisans formés dans ses ateliers.</p>
        </div>
        <aside class="regions" aria-label="Régions d'intervention">
          <strong class="regions__chiffre">{{ regionsTitre }}</strong>
          <span class="regions__libelle">régions d'intervention</span>
          <ul>
            @for (region of donnees.regions; track region) { <li>{{ region }}</li> }
          </ul>
        </aside>
      </header>

      <div class="chiffres" role="group" aria-label="Chiffres clés">
        @for (chiffre of donnees.chiffres; track chiffre.libelle) {
          <div class="chiffre">
            <app-compteur-anime class="num" [valeur]="chiffre.valeur" />
            <span>{{ chiffre.libelle }}</span>
            <span class="sr-only">{{ formater(chiffre.valeur) }} {{ chiffre.libelle }}</span>
          </div>
        }
      </div>
      <p class="source">Chiffres de la {{ donnees.source }}.</p>

      <section class="bloc" aria-labelledby="titre-mission">
        <h2 id="titre-mission">Notre mission</h2>
        <div class="cartes">
          @for (item of donnees.mission; track item.titre) {
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
          @for (valeur of donnees.valeurs; track valeur.titre) {
            <li><h3>{{ valeur.titre }}</h3><span class="text-muted">{{ valeur.texte }}</span></li>
          }
        </ul>
      </section>

      <section class="bloc" aria-labelledby="titre-distinctions">
        <h2 id="titre-distinctions">Distinctions</h2>
        <ol class="distinctions">
          @for (distinction of donnees.distinctions; track distinction.annee) {
            <li><span class="num">{{ distinction.annee }}</span><span>{{ distinction.titre }}</span></li>
          }
        </ol>
      </section>

      <div class="appel">
        <p>Chaque achat soutient les artisans et retire des pneus de nos quartiers.</p>
        <a routerLink="/" appButton="primary">Découvrir la boutique</a>
      </div>
    </div>
  `,
  styles: `
    .impact { display: grid; gap: var(--space-6); padding-block: var(--space-7); }
    .impact__intro { display: grid; gap: var(--space-5); }
    .impact__texte { display: grid; gap: var(--space-3); align-content: start; max-width: 75ch; }
    .impact h1 { text-wrap: balance; }
    .surtitre { font-size: 14px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--color-primary); }
    .regions {
      display: grid; gap: var(--space-1); align-content: start; padding: var(--space-5);
      border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface);
    }
    .regions__chiffre { font-size: clamp(32px, 5vw, 44px); line-height: 1.05; font-weight: 600; color: var(--color-chiffre); font-variant-numeric: tabular-nums; }
    .regions__libelle { color: var(--color-text-muted); }
    .regions ul { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: var(--space-2) 0 0; padding: 0; list-style: none; }
    .regions li {
      padding: var(--space-1) var(--space-3); border-radius: var(--radius-full);
      background: var(--color-primary-tint); color: var(--color-primary-strong); font-size: 14px; font-weight: 600;
    }
    .chiffres {
      display: grid; gap: var(--space-5); grid-template-columns: 1fr;
      padding: var(--space-6) var(--space-5); border-radius: var(--radius-md);
      background: var(--color-surface-dark); color: var(--color-text-on-dark);
    }
    .chiffre { display: grid; gap: var(--space-1); }
    .chiffre .num { font-size: clamp(32px, 5vw, 44px); line-height: 1.05; font-weight: 600; color: var(--color-vif); }
    .chiffre span { color: rgba(255, 255, 255, .82); }
    .source { margin-top: calc(-1 * var(--space-4)); font-size: 13px; color: var(--color-text-muted); }
    .bloc { display: grid; gap: var(--space-4); }
    .cartes { display: grid; gap: var(--space-4); grid-template-columns: 1fr; }
    .carte { display: grid; gap: var(--space-2); align-content: start; padding: var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); }
    .carte h3, .valeurs h3 { margin: 0; }
    .carte__icone { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--radius-full); background: var(--color-primary-tint); color: var(--color-primary-strong); }
    .valeurs { display: grid; gap: var(--space-3); grid-template-columns: 1fr; list-style: none; margin: 0; padding: 0; }
    .valeurs li { display: grid; gap: var(--space-1); align-content: start; padding-left: var(--space-3); border-left: 3px solid var(--color-vif); }
    .distinctions { display: grid; gap: var(--space-3); list-style: none; margin: 0; padding: 0; }
    .distinctions li { display: flex; gap: var(--space-4); align-items: baseline; }
    .distinctions .num { flex: none; min-width: 48px; font-weight: 600; color: var(--color-primary); font-variant-numeric: tabular-nums; }
    .appel { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-5); border-radius: var(--radius-md); background: var(--color-primary-tint); }
    .appel p { font-weight: 600; }
    @media (min-width: 640px) {
      .chiffres { grid-template-columns: repeat(2, 1fr); }
      .cartes { grid-template-columns: repeat(3, 1fr); }
      .valeurs { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 1024px) {
      .impact__intro { grid-template-columns: 7fr 5fr; align-items: start; }
      .chiffres { grid-template-columns: repeat(4, 1fr); }
      .valeurs { grid-template-columns: repeat(4, 1fr); }
      .distinctions { grid-template-columns: repeat(2, 1fr); }
    }
  `,
})
export class NotreImpactPageComponent {
  protected readonly donnees = DONNEES_IMPACT;
  protected readonly formater = formaterNombreFr;
  protected readonly surtitre = surtitreImpact(DONNEES_IMPACT);
  protected readonly regionsTitre = formaterNombreFr(DONNEES_IMPACT.regions.length);

  constructor() {
    inject(Meta).updateTag({
      name: 'description',
      content: "AS'SOUÉ transforme pneus usagés et plastiques en mobilier et objets du quotidien : 400 670 pneus recyclés, 801 emplois directs, 1 857 indirects, 5 régions.",
    });
  }
}
