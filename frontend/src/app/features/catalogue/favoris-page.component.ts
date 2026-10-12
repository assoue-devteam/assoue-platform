import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { SrcImagePipe } from '../../shared/images/src-image.pipe';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { FavoriBoutonComponent } from './favori-bouton.component';
import { FavorisService } from './favoris.service';
import { PanierService } from './panier.service';

@Component({
  standalone: true,
  imports: [RouterLink, FcfaPipe, SrcImagePipe, ButtonDirective, EmptyStateComponent, ErrorStateComponent, SkeletonComponent, FavoriBoutonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="favoris container">
      <h1>Mes favoris</h1>
      @if (favoris.chargement()) { <app-skeleton [lignes]="4" /> }
      @else if (favoris.erreur()) { <app-error-state type="reseau" titre="Vos favoris ne sont pas disponibles" [reessayable]="true" (reessayer)="favoris.charger()" /> }
      @else if (!favoris.produits().length) {
        <app-empty-state message="Touchez le cœur d'un produit pour le retrouver ici."><a routerLink="/" appButton="secondary">Voir le catalogue</a></app-empty-state>
      } @else {
        <ul class="liste">
          @for (produit of favoris.produits(); track produit.id) {
            <li class="ligne">
              <a [routerLink]="['/produits', produit.id]" class="ligne__image">
                @if (produit.imageUrl) { <img [src]="produit.imageUrl | srcImage" [alt]="produit.nom" /> } @else { <span aria-hidden="true">AS'SOUÉ</span> }
              </a>
              <div class="ligne__detail">
                <a [routerLink]="['/produits', produit.id]">{{ produit.nom }}</a>
                <span class="text-muted">{{ produit.categorie }} · {{ produit.prix | fcfa }}</span>
                @if (produit.enRupture) { <span class="rupture">Indisponible</span> }
              </div>
              <div class="ligne__actions">
                @if (!produit.enRupture) { <button type="button" appButton="secondary" (click)="panier.ajouter(produit)">Ajouter au panier</button> }
                <app-favori-bouton [produit]="produit" />
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .favoris { display: grid; gap: var(--space-5); padding-block: var(--space-6); }
    .liste { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--color-border); }
    .ligne { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: var(--space-3); align-items: center; padding: var(--space-4) 0; border-bottom: 1px solid var(--color-border); }
    .ligne__image { aspect-ratio: 4 / 5; display: grid; place-items: center; overflow: hidden; border-radius: var(--radius-sm); background: var(--color-surface-alt); color: var(--color-primary-strong); font: 600 12px var(--font-display); text-decoration: none; }
    .ligne__image img { width: 100%; height: 100%; object-fit: cover; }
    .ligne__detail { display: grid; gap: var(--space-1); }
    .ligne__detail a { color: var(--color-text); font-weight: 600; text-decoration: none; }
    .ligne__detail span { font-size: 14px; }
    .ligne__actions { grid-column: 1 / -1; display: flex; align-items: center; justify-content: flex-end; gap: var(--space-3); }
    .rupture { color: var(--color-error); font-weight: 600; }
    @media (min-width: 768px) {
      .ligne { grid-template-columns: 80px minmax(0, 1fr) auto; }
      .ligne__actions { grid-column: auto; }
    }
  `,
})
export class FavorisPageComponent {
  protected favoris = inject(FavorisService);
  protected panier = inject(PanierService);
}
