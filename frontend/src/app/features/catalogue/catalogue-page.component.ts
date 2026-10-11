import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categorie, Produit } from '../../shared/models/api';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { SrcImagePipe } from '../../shared/images/src-image.pipe';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { CatalogueService } from './catalogue.service';
import { PanierService } from './panier.service';
import { FavoriBoutonComponent } from './favori-bouton.component';
import { EtoilesComponent } from '../../shared/ui/etoiles.component';

export type TriCatalogue = 'pertinence' | 'prix-asc' | 'prix-desc' | 'nouveautes';

const TRIS: { valeur: TriCatalogue; libelle: string }[] = [
  { valeur: 'pertinence', libelle: 'Pertinence' },
  { valeur: 'prix-asc', libelle: 'Prix croissant' },
  { valeur: 'prix-desc', libelle: 'Prix décroissant' },
  { valeur: 'nouveautes', libelle: 'Nouveautés' },
];

/** Tri inconnu dans l'URL → pertinence (ordre renvoyé par le serveur). */
export function lireTriParam(valeur: unknown): TriCatalogue {
  return TRIS.some(t => t.valeur === valeur) ? (valeur as TriCatalogue) : 'pertinence';
}

/** Catégorie inconnue dans l'URL → null (tout le catalogue). */
export function lireCategorieParam(valeur: unknown, connues: Categorie[]): number | null {
  const id = typeof valeur === 'string' && /^\d+$/.test(valeur) ? Number(valeur) : null;
  return id !== null && connues.some(c => c.id === id) ? id : null;
}

/**
 * Tri appliqué côté client : l'API ne propose ni recherche ni tri
 * (contrat : GET /api/produits?categorieId=). « Nouveautés » s'appuie sur l'id
 * croissant comme approximation, l'API ne renvoyant aucune date — limite connue.
 */
export function trierProduits(produits: Produit[], tri: TriCatalogue): Produit[] {
  const liste = [...produits];
  if (tri === 'prix-asc') liste.sort((a, b) => (a.prix ?? Infinity) - (b.prix ?? Infinity));
  if (tri === 'prix-desc') liste.sort((a, b) => (b.prix ?? -Infinity) - (a.prix ?? -Infinity));
  if (tri === 'nouveautes') liste.sort((a, b) => b.id - a.id);
  return liste;
}

@Component({
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, FormsModule, FcfaPipe, SrcImagePipe, AlertComponent, ButtonDirective, EmptyStateComponent, ErrorStateComponent, SkeletonComponent, IconComponent, FavoriBoutonComponent, EtoilesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="catalogue container">
      <div class="catalogue__intro">
        <h1 class="display">Objets fabriqués à partir de déchets collectés au Burkina Faso</h1>
        <p class="text-muted catalogue__soustitre">Mobilier, bijoux, chaussures et accessoires conçus à partir de plastique et de pneus récupérés.</p>
      </div>
      @if (erreurCategories()) {
        <app-alert tone="warning">Les catégories ne sont pas disponibles. Tous les produits restent affichés.</app-alert>
      }
      <div class="outils">
        @if (categories().length) {
          <div class="filtres defilement-horizontal" role="group" aria-label="Catégories" tabindex="0">
            <button type="button" [class.actif]="categorieSelectionnee() === null" [attr.aria-pressed]="categorieSelectionnee() === null" (click)="choisirCategorie(null)">Tout</button>
            @for (categorie of categories(); track categorie.id) {
              <button type="button" [class.actif]="categorieSelectionnee() === categorie.id" [attr.aria-pressed]="categorieSelectionnee() === categorie.id" (click)="choisirCategorie(categorie.id)">{{ categorie.nom }}</button>
            }
          </div>
        }
        <div class="outils__droite">
          <p class="resultat" aria-live="polite">{{ produitsAffiches().length }} {{ produitsAffiches().length > 1 ? 'produits' : 'produit' }}</p>
          <label class="tri">Trier par
            <select [ngModel]="tri()" (ngModelChange)="choisirTri($event)">
              @for (option of tris; track option.valeur) { <option [value]="option.valeur">{{ option.libelle }}</option> }
            </select>
          </label>
        </div>
      </div>
      @if (chargement()) {
        <div class="grille" aria-busy="true" aria-label="Chargement des produits">
          @for (_ of squelettes; track $index) { <div class="carte carte--squelette"><app-skeleton [lignes]="3" /></div> }
        </div>
      } @else if (erreur()) {
        <app-error-state type="reseau" titre="Le catalogue est indisponible" texte="Nous ne pouvons pas charger les produits pour le moment." [reessayable]="true" (reessayer)="chargerProduits()" />
      } @else if (!produitsAffiches().length) {
        @if (recherche().trim()) {
          <app-empty-state [message]="'Aucun produit ne correspond à « ' + recherche().trim() + ' ».'">
            <button type="button" appButton="secondary" (click)="reinitialiserFiltres()">Réinitialiser les filtres</button>
          </app-empty-state>
        } @else {
          <app-empty-state message="Aucun produit dans cette catégorie pour le moment.">
            <div class="vide-actions">
              @for (categorie of categories(); track categorie.id) {
                <button type="button" appButton="secondary" (click)="choisirCategorie(categorie.id)">{{ categorie.nom }}</button>
              }
              <button type="button" appButton="secondary" (click)="reinitialiserFiltres()">Réinitialiser les filtres</button>
            </div>
          </app-empty-state>
        }
      } @else {
        @if (vedettes().length) {
          <section class="vedettes" aria-labelledby="titre-vedettes">
            <h2 id="titre-vedettes">Produits vedettes</h2>
            <div class="grille">
              @for (produit of vedettes(); track produit.id) {
                <ng-container *ngTemplateOutlet="carte; context: { $implicit: produit }" />
              }
            </div>
          </section>
        }
        <div class="grille">
          @for (produit of produitsAffiches(); track produit.id) {
            <ng-container *ngTemplateOutlet="carte; context: { $implicit: produit }" />
          }
        </div>
      }
    </section>
    <ng-template #carte let-produit>
    <article class="carte">
      <a class="carte__media" [routerLink]="['/produits', produit.id]" [attr.aria-label]="'Voir ' + produit.nom">
        @if (produit.imageUrl && !imagesEnErreur().has(produit.id)) {
          <img [src]="produit.imageUrl | srcImage" [alt]="produit.nom" loading="lazy" (error)="imageEnErreur(produit.id)" />
        } @else { <span class="carte__vide" aria-hidden="true">AS'SOUÉ</span> }
        <span class="badge-eco" title="Fabriqué à partir de déchets recyclés"><app-icon name="leaf" [size]="16" /> ÉCO</span>
      </a>
      <app-favori-bouton class="carte__favori" [produit]="produit" />
      <div class="carte__contenu">
        <p class="carte__categorie">{{ produit.categorie }}</p>
        <h2><a [routerLink]="['/produits', produit.id]">{{ produit.nom }}</a></h2>
        <app-etoiles [note]="produit.noteMoyenne" [nombre]="produit.nombreAvis" />
        @if (produit.prix === null || produit.prix === undefined) {
          <p class="carte__prix">Prix sur demande</p>
          <button type="button" appButton="purchase" [block]="true" disabled>Ajouter au panier</button>
        } @else {
          <p class="carte__prix">{{ produit.prix | fcfa }}</p>
          @if (produit.enRupture) {
            <span class="rupture">Rupture de stock</span>
            <button type="button" appButton="purchase" [block]="true" disabled>Indisponible</button>
          } @else { <button type="button" appButton="purchase" [block]="true" (click)="panier.ajouter(produit)">Ajouter au panier</button> }
        }
      </div>
    </article>
    </ng-template>
  `,
  styles: `
    .catalogue { padding-block: var(--space-7); } .catalogue__intro { margin-bottom: var(--space-6); }
    .catalogue__intro h1 { text-wrap: balance; } .catalogue__soustitre { max-width: 60ch; margin-top: var(--space-2); }
    .outils { display: flex; align-items: end; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-4); }
    .filtres { display: flex; gap: var(--space-2); overflow-x: auto; padding-bottom: var(--space-1); flex: 1; }
    .filtres button { flex:none; min-height:44px; padding:0 var(--space-4); border:1px solid var(--color-border-strong); border-radius:var(--radius-full); background:var(--color-surface); color:var(--color-text); cursor:pointer; }
    .filtres .actif { border-color:var(--color-primary); background:var(--color-primary); color:var(--color-text-on-dark); font-weight:600; }
    .outils__droite { display: flex; align-items: center; gap: var(--space-4); flex: none; }
    .resultat { font-size: 14px; color: var(--color-text-muted); white-space: nowrap; }
    .tri { display: flex; align-items: center; gap: var(--space-2); font-size: 14px; font-weight: 600; white-space: nowrap; }
    .tri select { min-height: 44px; padding: 0 var(--space-2); border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-text); font: 400 14px var(--font-text); }
    .vide-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: center; }
    .carte { position:relative; } .carte__favori { position:absolute; top:var(--space-2); right:var(--space-2); }
    .vedettes { display:grid; gap:var(--space-4); margin-bottom:var(--space-6); padding-bottom:var(--space-6); border-bottom:1px solid var(--color-border); } .vedettes h2 { font-size:22px; }
    .grille { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--space-4); align-content:start; } .carte { overflow:hidden; border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); min-width:0; }
    .carte__media { position:relative; display:block; aspect-ratio:4/5; background:var(--color-surface-alt); color:var(--color-primary-strong); text-decoration:none; } .carte__media img { width:100%; height:100%; object-fit:cover; } .carte__vide { display:grid; place-items:center; height:100%; font:600 20px var(--font-display); }
    .badge-eco { position:absolute; top:var(--space-2); left:var(--space-2); display:inline-flex; align-items:center; gap:var(--space-1); padding:2px var(--space-2); border-radius:var(--radius-full); background:var(--color-primary-tint); color:var(--color-primary-strong); font-size:13px; font-weight:600; }
    .carte__contenu { display:grid; gap:var(--space-2); padding:var(--space-3); } .carte__categorie { font-size:14px; color:var(--color-text-muted); }
    .carte h2 { font:600 18px/1.3 var(--font-text); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; } .carte h2 a { color:inherit; text-decoration:none; } .carte h2 a:hover { text-decoration:underline; } .carte__prix { font-weight:600; } .rupture { color:var(--color-error); font-weight:600; }
    .carte--squelette { min-height:280px; padding:var(--space-3); } @media (min-width:600px) { .grille { grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--space-5); } } @media (min-width:1024px) { .catalogue { padding-block:var(--space-8); } .grille { grid-template-columns:repeat(4,minmax(0,1fr)); } }
    @media (max-width: 1023px) { .outils { flex-wrap: wrap; } .outils__droite { width: 100%; justify-content: space-between; } }
  `,
})
export class CataloguePageComponent {
  private catalogue = inject(CatalogueService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected panier = inject(PanierService);
  protected categories = signal<Categorie[]>([]);
  protected produits = signal<Produit[]>([]);
  protected categorieSelectionnee = signal<number | null>(null);
  protected chargement = signal(true);
  protected erreur = signal(false);
  protected erreurCategories = signal(false);
  protected readonly squelettes = Array.from({ length: 8 });
  protected recherche = signal('');
  protected tri = signal<TriCatalogue>('pertinence');
  protected readonly tris = TRIS;
  protected imagesEnErreur = signal<Set<number>>(new Set());

  // En vitrine seulement sur le catalogue complet non trié : sinon doublon avec la grille.
  protected vedettes = computed(() => this.recherche().trim() || this.categorieSelectionnee() !== null || this.tri() !== 'pertinence'
    ? []
    : this.produits().filter(produit => produit.vedette).slice(0, 4));
  protected produitsAffiches = computed(() => {
    const terme = normaliser(this.recherche().trim());
    const filtres = terme
      ? this.produits().filter(produit => normaliser(`${produit.nom} ${produit.categorie}`).includes(terme))
      : this.produits();
    return trierProduits(filtres, this.tri());
  });

  constructor() {
    this.chargerCategories();
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      const q = typeof params['q'] === 'string' ? params['q'] : '';
      const tri = lireTriParam(params['tri']);
      const categorie = lireCategorieParam(params['categorie'], this.categories());
      if (q !== this.recherche()) this.recherche.set(q);
      if (tri !== this.tri()) this.tri.set(tri);
      // La catégorie peut arriver avant les catégories : on la valide à leur chargement aussi.
      if (categorie !== this.categorieSelectionnee()) {
        this.categorieSelectionnee.set(categorie);
        this.chargerProduits();
      }
    });
    this.chargerProduits();
  }

  protected choisirCategorie(id: number | null): void {
    if (id === this.categorieSelectionnee()) return;
    this.categorieSelectionnee.set(id);
    this.chargerProduits();
    this.ecrireUrl();
  }

  protected choisirTri(tri: TriCatalogue): void {
    this.tri.set(tri);
    this.ecrireUrl();
  }

  protected reinitialiserFiltres(): void {
    const categorieChangee = this.categorieSelectionnee() !== null;
    this.recherche.set('');
    this.tri.set('pertinence');
    this.categorieSelectionnee.set(null);
    if (categorieChangee) this.chargerProduits();
    this.router.navigate([], { queryParams: { q: null, categorie: null, tri: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected imageEnErreur(id: number): void {
    this.imagesEnErreur.update(ids => new Set(ids).add(id));
  }

  protected chargerProduits(): void {
    this.chargement.set(true); this.erreur.set(false);
    const id = this.categorieSelectionnee() ?? undefined;
    this.catalogue.produits(id).subscribe({ next: produits => { this.produits.set(produits); this.chargement.set(false); }, error: () => { this.erreur.set(true); this.chargement.set(false); } });
  }

  private chargerCategories(): void {
    this.catalogue.categories().subscribe({
      next: categories => {
        this.categories.set(categories);
        // Valide la catégorie lue dans l'URL une fois le référentiel connu.
        const params = this.route.snapshot.queryParams;
        const validee = lireCategorieParam(params['categorie'], categories);
        if (validee !== this.categorieSelectionnee()) {
          this.categorieSelectionnee.set(validee);
          this.chargerProduits();
        }
      },
      error: () => this.erreurCategories.set(true),
    });
  }

  private ecrireUrl(): void {
    this.router.navigate([], {
      queryParams: {
        q: this.recherche().trim() || null,
        categorie: this.categorieSelectionnee(),
        tri: this.tri() === 'pertinence' ? null : this.tri(),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

// « pneu », « Pneu » et « pnéu » doivent tous trouver « Pouf en pneu recyclé ».
export function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
