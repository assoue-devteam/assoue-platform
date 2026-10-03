import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categorie, Produit } from '../../shared/models/api';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { CatalogueService } from './catalogue.service';
import { PanierService } from './panier.service';

@Component({
  standalone: true,
  imports: [RouterLink, FcfaPipe, AlertComponent, ButtonDirective, EmptyStateComponent, ErrorStateComponent, SkeletonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="catalogue container">
      <div class="catalogue__intro">
        <p class="eyebrow">AS'SOUÉ</p>
        <h1>Objets fabriqués à partir de déchets collectés au Burkina Faso</h1>
        <p class="text-muted">Mobilier, bijoux, chaussures et accessoires conçus à partir de plastique et de pneus récupérés.</p>
      </div>
      <div class="recherche">
        <label for="recherche-produit" class="sr-only">Rechercher un produit</label>
        <app-icon name="search" />
        <input id="recherche-produit" type="search" placeholder="Rechercher un produit…" autocomplete="off"
               [value]="recherche()" (input)="recherche.set($any($event.target).value)" />
      </div>
      @if (erreurCategories()) {
        <app-alert tone="warning">Les catégories ne sont pas disponibles. Tous les produits restent affichés.</app-alert>
      } @else if (categories().length) {
        <div class="filtres" role="group" aria-label="Catégories">
          <button type="button" [class.actif]="categorieSelectionnee() === null" [attr.aria-pressed]="categorieSelectionnee() === null" (click)="choisirCategorie(null)">Tout</button>
          @for (categorie of categories(); track categorie.id) {
            <button type="button" [class.actif]="categorieSelectionnee() === categorie.id" [attr.aria-pressed]="categorieSelectionnee() === categorie.id" (click)="choisirCategorie(categorie.id)">{{ categorie.nom }}</button>
          }
        </div>
      }
      @if (chargement()) {
        <div class="grille" aria-busy="true" aria-label="Chargement des produits">
          @for (_ of squelettes; track $index) { <div class="carte carte--squelette"><app-skeleton [lignes]="3" /></div> }
        </div>
      } @else if (erreur()) {
        <app-error-state type="reseau" titre="Le catalogue est indisponible" texte="Nous ne pouvons pas charger les produits pour le moment." [reessayable]="true" (reessayer)="chargerProduits()" />
      } @else if (!produitsAffiches().length) {
        @if (recherche().trim()) {
          <app-empty-state [message]="'Aucun produit ne correspond à « ' + recherche().trim() + ' ».'"><button type="button" appButton="secondary" (click)="recherche.set('')">Effacer la recherche</button></app-empty-state>
        } @else {
          <app-empty-state message="Aucun produit ne correspond à cette catégorie."><a routerLink="/" appButton="secondary" (click)="choisirCategorie(null)">Afficher tout le catalogue</a></app-empty-state>
        }
      } @else {
        <p class="resultat" aria-live="polite">{{ produitsAffiches().length }} {{ produitsAffiches().length > 1 ? 'produits' : 'produit' }}</p>
        <div class="grille">
          @for (produit of produitsAffiches(); track produit.id) {
            <article class="carte">
              <a class="carte__media" [routerLink]="['/produits', produit.id]" [attr.aria-label]="'Voir ' + produit.nom">
                @if (produit.imageUrl) { <img [src]="produit.imageUrl" [alt]="produit.nom" /> } @else { <span class="carte__vide" aria-hidden="true">AS'SOUÉ</span> }
                <span class="badge-eco" title="Fabriqué à partir de déchets recyclés"><app-icon name="leaf" [size]="16" /> ÉCO</span>
              </a>
              <div class="carte__contenu">
                <p class="carte__categorie">{{ produit.categorie }}</p>
                <h2><a [routerLink]="['/produits', produit.id]">{{ produit.nom }}</a></h2>
                <p class="carte__prix">{{ produit.prix | fcfa }}</p>
                @if (produit.enRupture) { <span class="rupture">Indisponible</span> }
                @else { <button type="button" appButton="purchase" [block]="true" (click)="panier.ajouter(produit)">Ajouter au panier</button> }
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .catalogue { padding-block: var(--space-7); } .catalogue__intro { max-width: 700px; margin-bottom: var(--space-6); }
    .eyebrow,.carte__categorie,.resultat { font-size: 14px; color: var(--color-text-muted); } .eyebrow { font-weight: 600; color: var(--color-primary); }
    .recherche { position:relative; display:flex; align-items:center; max-width:480px; margin-bottom:var(--space-4); color:var(--color-text-muted); }
    .recherche app-icon { position:absolute; left:var(--space-3); pointer-events:none; }
    .recherche input { width:100%; height:var(--control-height); padding:0 var(--space-3) 0 44px; border:1px solid var(--color-border-strong); border-radius:var(--radius-sm); background:var(--color-surface); color:var(--color-text); font:400 16px var(--font-text); }
    .recherche input:focus-visible { outline:none; box-shadow:var(--focus-ring); }
    .filtres { display:flex; gap:var(--space-2); overflow-x:auto; padding-bottom:var(--space-3); margin-bottom:var(--space-4); }
    .filtres button { flex:none; min-height:44px; padding:0 var(--space-4); border:1px solid var(--color-border-strong); border-radius:var(--radius-full); background:var(--color-surface); color:var(--color-text); cursor:pointer; }
    .filtres .actif { border-color:var(--color-primary); background:var(--color-primary); color:var(--color-text-on-dark); font-weight:600; }
    .grille { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--space-4); } .carte { overflow:hidden; border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); }
    .carte__media { position:relative; display:block; aspect-ratio:4/5; background:var(--color-surface-alt); color:var(--color-primary-strong); text-decoration:none; } .carte__media img { width:100%; height:100%; object-fit:cover; } .carte__vide { display:grid; place-items:center; height:100%; font:600 20px var(--font-display); }
    .badge-eco { position:absolute; top:var(--space-2); left:var(--space-2); display:inline-flex; align-items:center; gap:var(--space-1); padding:2px var(--space-2); border-radius:var(--radius-full); background:var(--color-primary-tint); color:var(--color-primary-strong); font-size:13px; font-weight:600; }
    .carte__contenu { display:grid; gap:var(--space-2); padding:var(--space-3); } .carte h2 { font:600 18px/1.3 var(--font-text); } .carte h2 a { color:inherit; text-decoration:none; } .carte h2 a:hover { text-decoration:underline; } .carte__prix { font-weight:600; } .rupture { color:var(--color-error); font-weight:600; }
    .carte--squelette { min-height:280px; padding:var(--space-3); } @media (min-width:600px) { .grille { grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--space-5); } } @media (min-width:1024px) { .catalogue { padding-block:var(--space-8); } .grille { grid-template-columns:repeat(4,minmax(0,1fr)); } }
  `,
})
export class CataloguePageComponent {
  private catalogue = inject(CatalogueService);
  protected panier = inject(PanierService);
  protected categories = signal<Categorie[]>([]);
  protected produits = signal<Produit[]>([]);
  protected categorieSelectionnee = signal<number | null>(null);
  protected chargement = signal(true);
  protected erreur = signal(false);
  protected erreurCategories = signal(false);
  protected readonly squelettes = Array.from({ length: 8 });
  protected recherche = signal('');
  protected produitsAffiches = computed(() => {
    const terme = normaliser(this.recherche().trim());
    if (!terme) return this.produits();
    return this.produits().filter(produit => normaliser(`${produit.nom} ${produit.categorie}`).includes(terme));
  });

  constructor() { this.chargerCategories(); this.chargerProduits(); }
  protected choisirCategorie(id: number | null): void { this.categorieSelectionnee.set(id); this.chargerProduits(); }
  protected chargerProduits(): void {
    this.chargement.set(true); this.erreur.set(false);
    const id = this.categorieSelectionnee() ?? undefined;
    this.catalogue.produits(id).subscribe({ next: produits => { this.produits.set(produits); this.chargement.set(false); }, error: () => { this.erreur.set(true); this.chargement.set(false); } });
  }
  private chargerCategories(): void {
    this.catalogue.categories().subscribe({ next: categories => this.categories.set(categories), error: () => this.erreurCategories.set(true) });
  }
}

// « pneu », « Pneu » et « pnéu » doivent tous trouver « Pouf en pneu recyclé ».
function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
