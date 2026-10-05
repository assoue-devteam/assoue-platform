import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Produit } from '../../shared/models/api';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { SrcImagePipe } from '../../shared/images/src-image.pipe';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { CatalogueService } from './catalogue.service';
import { PanierService } from './panier.service';
import { FavoriBoutonComponent } from './favori-bouton.component';
import { AvisSectionComponent } from './avis-section.component';
import { EtoilesComponent } from '../../shared/ui/etoiles.component';

@Component({
  standalone: true,
  imports: [RouterLink, FcfaPipe, SrcImagePipe, ButtonDirective, ErrorStateComponent, SkeletonComponent, FavoriBoutonComponent, AvisSectionComponent, EtoilesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="produit container">
      <a routerLink="/" class="retour">Retour au catalogue</a>
      @if (produit(); as item) {
        <div class="produit__grille">
          <div class="produit__media"><app-favori-bouton class="produit__favori" [produit]="item" />@if (item.imageUrl) { <img [src]="item.imageUrl | srcImage" [alt]="item.nom" /> } @else { <span aria-hidden="true">AS'SOUÉ</span> }</div>
          <div class="produit__infos"><p class="categorie">{{ item.categorie }}</p><h1>{{ item.nom }}</h1><app-etoiles [note]="item.noteMoyenne" [nombre]="item.nombreAvis" /><p class="prix">{{ item.prix | fcfa }}</p><p class="description">{{ item.description }}</p>
            @if (item.enRupture) { <p class="rupture">Ce produit est momentanément indisponible.</p> } @else { <button type="button" appButton="purchase" (click)="panier.ajouter(item)">Ajouter au panier</button> }
          </div>
        </div>
        <app-avis-section [produitId]="item.id" />
      }
      @else if (chargement()) { <div class="produit__squelette"><app-skeleton [lignes]="5" /></div> }
      @else { <app-error-state type="introuvable" titre="Produit introuvable" texte="Ce produit n'est plus disponible dans le catalogue."><a routerLink="/" appButton="secondary">Retour au catalogue</a></app-error-state> }
    </section>`,
  styles: `.produit { display:grid; gap:var(--space-6); padding-block:var(--space-6); } .retour { justify-self:start; color:var(--color-primary); } .produit__grille { display:grid; gap:var(--space-6); } .produit__media { position:relative; aspect-ratio:4/5; display:grid; place-items:center; background:var(--color-surface-alt); color:var(--color-primary-strong); font:600 28px var(--font-display); } .produit__favori { position:absolute; top:var(--space-3); right:var(--space-3); } .produit__media img { width:100%; height:100%; object-fit:cover; } .produit__infos { display:grid; align-content:start; gap:var(--space-4); max-width:560px; } .categorie { color:var(--color-text-muted); } .prix { font-size:24px; font-weight:600; } .description { color:var(--color-text-muted); white-space:pre-line; } .rupture { color:var(--color-error); font-weight:600; } .produit__squelette { max-width:600px; padding:var(--space-6); background:var(--color-surface); } @media (min-width:768px) { .produit__grille { grid-template-columns:minmax(0,1fr) minmax(320px,.8fr); align-items:start; } }`,
})
export class ProduitPageComponent {
  private route = inject(ActivatedRoute);
  private catalogue = inject(CatalogueService);
  protected panier = inject(PanierService);
  protected produit = signal<Produit | null>(null);
  protected chargement = signal(true);
  protected erreur = signal(false);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id <= 0) { this.erreur.set(true); this.chargement.set(false); return; }
    this.catalogue.produit(id).subscribe({ next: produit => { this.produit.set(produit); this.chargement.set(false); }, error: () => { this.erreur.set(true); this.chargement.set(false); } });
  }
}
