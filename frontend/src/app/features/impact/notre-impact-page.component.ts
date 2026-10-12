import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { SrcImagePipe } from '../../shared/images/src-image.pipe';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { formaterNombreFr } from '../../shared/nombres';
import { Produit } from '../../shared/models/api';
import { CatalogueService } from '../catalogue/catalogue.service';
import { CompteurAnimeComponent } from './compteur-anime.component';
import { DONNEES_IMPACT, SURTITRE_IMPACT } from './impact-donnees';

// PUB-05 : chiffres, mission, valeurs et distinctions de la plaquette, mis en page
// comme le catalogue (même conteneur, mêmes marges). Le bouton mène à "/" : c'est
// la route réelle du catalogue (écart avec le DS §8 qui écrit "/catalogue", signalé).
@Component({
  standalone: true,
  imports: [RouterLink, ButtonDirective, SrcImagePipe, FcfaPipe, CompteurAnimeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="impact container">
      <header class="impact__intro">
        <div class="impact__texte">
          <p class="surtitre">{{ surtitre }}</p>
          <h1 class="display">L'art du recyclage pour un avenir durable</h1>
          <p class="text-muted">AS'SOUÉ est une entreprise sociale et écologique : elle transforme les pneus usagés et les sachets plastiques en meubles, chaussures et objets du quotidien, fabriqués par des artisans formés dans ses ateliers.</p>
        </div>
        <img class="impact__photo" src="/assets/impact-gueridon.webp" alt="Guéridon AS'SOUÉ avec plateau en pagne et pieds en bois" width="864" height="864" fetchpriority="high" />
      </header>

      <section class="chiffres" aria-labelledby="titre-chiffres">
        <h2 id="titre-chiffres" class="sr-only">Chiffres clés</h2>
        <div class="chiffres__grille">
          <div class="chiffres__liste">
            @for (chiffre of donnees.chiffres; track chiffre.libelle) {
              <div class="chiffre">
                <app-compteur-anime class="num" [valeur]="chiffre.valeur" />
                <span class="chiffre__libelle">{{ chiffre.libelle }}</span>
                <span class="chiffre__contexte">{{ chiffre.contexte }}</span>
                <span class="sr-only">{{ formater(chiffre.valeur) }} {{ chiffre.libelle }}</span>
              </div>
            }
          </div>
          <aside class="regions" aria-label="Régions d'intervention">
            <strong class="regions__chiffre">{{ regionsTitre }}</strong>
            <span class="regions__libelle">régions d'intervention</span>
            <ul>
              @for (region of donnees.regions; track region) { <li>{{ region }}</li> }
            </ul>
          </aside>
        </div>
        <p class="source">Chiffres de la {{ donnees.source }}.</p>
      </section>

      @if (vedettes().length) {
        <section class="devenir" aria-labelledby="titre-devenir">
          <h2 id="titre-devenir">Ce que deviennent les pneus</h2>
          <div class="devenir__produits">
            @for (produit of vedettes(); track produit.id) {
              <article class="produit">
                <a class="produit__media" [routerLink]="['/produits', produit.id]" [attr.aria-label]="'Voir ' + produit.nom">
                  <img [src]="produit.imageUrl | srcImage" [alt]="produit.nom" loading="lazy" />
                </a>
                <h3><a [routerLink]="['/produits', produit.id]">{{ produit.nom }}</a></h3>
                <p class="produit__prix">{{ produit.prix | fcfa }}</p>
              </article>
            }
          </div>
        </section>
      }

      <section class="bloc" aria-labelledby="titre-mission">
        <h2 id="titre-mission">Notre mission</h2>
        <div class="cartes">
          @for (item of donnees.mission; track item.titre) {
            <article class="carte">
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
        <ol class="frise">
          @for (distinction of donnees.distinctions; track distinction.annee) {
            <li class="frise__item">
              <span class="frise__annee">{{ distinction.annee }}</span>
              <span class="frise__titre">{{ distinction.titre }}</span>
            </li>
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
    .impact__intro { display: grid; gap: var(--space-5); align-items: start; }
    .impact__texte { display: grid; gap: var(--space-3); align-content: start; max-width: 75ch; }
    .impact h1 { text-wrap: balance; }
    .surtitre { font-size: 14px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--color-primary); }
    .impact__photo { width: 100%; height: auto; border-radius: var(--radius-md); object-fit: cover; }

    .chiffres { display: grid; gap: var(--space-4); padding: var(--space-6) var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); }
    .chiffres__grille { display: grid; gap: var(--space-5); }
    .chiffres__liste { display: grid; gap: var(--space-5); }
    .chiffre { display: grid; gap: var(--space-1); padding-left: var(--space-5); border-left: 1px solid var(--color-border); }
    .chiffre:first-child { padding-left: 0; border-left: 0; }
    .chiffre .num { font-size: clamp(32px, 5vw, 44px); line-height: 1.05; font-weight: 600; color: var(--color-chiffre); }
    .chiffre__libelle { font-weight: 600; }
    .chiffre__contexte { font-size: 14px; color: var(--color-text-muted); }
    .source { font-size: 13px; color: var(--color-text-muted); }

    .regions { display: grid; gap: var(--space-1); align-content: start; padding: var(--space-5); border-radius: var(--radius-md); background: var(--color-primary-tint); }
    .regions__chiffre { font-size: clamp(32px, 5vw, 44px); line-height: 1.05; font-weight: 600; color: var(--color-primary-strong); font-variant-numeric: tabular-nums; }
    .regions__libelle { color: var(--color-text-muted); }
    .regions ul { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: var(--space-2) 0 0; padding: 0; list-style: none; }
    .regions li { padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); background: var(--color-surface); color: var(--color-primary-strong); font-size: 14px; font-weight: 600; }

    .devenir { display: grid; gap: var(--space-4); }
    .devenir__produits { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); }
    .produit { display: grid; gap: var(--space-2); align-content: start; }
    .produit__media { display: block; border-radius: var(--radius-md); overflow: hidden; background: var(--color-surface-alt); }
    .produit__media img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
    .produit h3 { font-size: 16px; }
    .produit h3 a { color: var(--color-text); text-decoration: none; }
    .produit h3 a:hover { color: var(--color-primary); }
    .produit__prix { font-weight: 600; color: var(--color-primary); }

    .bloc { display: grid; gap: var(--space-4); }
    .cartes { display: grid; gap: var(--space-4); grid-template-columns: 1fr; }
    .carte { display: grid; gap: var(--space-2); align-content: start; padding: var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); }
    .carte h3, .valeurs h3 { margin: 0; }
    .valeurs { display: grid; gap: var(--space-3); grid-template-columns: 1fr; list-style: none; margin: 0; padding: 0; }
    .valeurs li { display: grid; gap: var(--space-1); align-content: start; padding-left: var(--space-3); border-left: 3px solid var(--color-vif); }

    .frise { display: grid; gap: var(--space-4); list-style: none; margin: 0; padding: 0; }
    .frise__item { display: grid; gap: var(--space-1); }
    .frise__annee { font-weight: 600; color: var(--color-primary); font-variant-numeric: tabular-nums; }
    .frise__titre { color: var(--color-text-muted); }

    .appel { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-5); border-radius: var(--radius-md); background: var(--color-primary); }
    .appel p { font-weight: 600; color: var(--color-text-on-dark); }

    @media (min-width: 640px) {
      .chiffres__liste { grid-template-columns: repeat(3, 1fr); }
      .cartes { grid-template-columns: repeat(3, 1fr); }
      .valeurs { grid-template-columns: repeat(2, 1fr); }
      .frise { grid-template-columns: repeat(4, 1fr); }
    }
    @media (min-width: 1024px) {
      .impact__intro { grid-template-columns: 7fr 5fr; }
      .chiffres__grille { grid-template-columns: 1fr auto; align-items: start; }
      .valeurs { grid-template-columns: repeat(4, 1fr); }
    }
  `,
})
export class NotreImpactPageComponent {
  private catalogue = inject(CatalogueService);

  protected readonly donnees = DONNEES_IMPACT;
  protected readonly formater = formaterNombreFr;
  protected readonly surtitre = SURTITRE_IMPACT;
  protected readonly regionsTitre = formaterNombreFr(DONNEES_IMPACT.regions.length);
  protected vedettes = signal<Produit[]>([]);

  constructor() {
    inject(Meta).updateTag({
      name: 'description',
      content: "AS'SOUÉ transforme pneus usagés et plastiques en mobilier et objets du quotidien : 400 670 pneus recyclés, 801 emplois directs, 1 857 indirects, 5 régions.",
    });
    // La section « Ce que deviennent les pneus » disparaît proprement si l'API
    // ne renvoie rien ou en cas d'erreur.
    this.catalogue.produits().subscribe({
      next: produits => this.vedettes.set(produits.filter(produit => produit.vedette).slice(0, 4)),
      error: () => {},
    });
  }
}
