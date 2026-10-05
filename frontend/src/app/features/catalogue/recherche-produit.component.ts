import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';

/**
 * Recherche catalogue partagée (en-tête boutique, toutes les pages sauf le layout auth).
 * Soumet vers /?q=<terme> : le catalogue lit q dans l'URL (lien partageable, retour OK).
 * L'API ne propose ni recherche ni tri (contrat : GET /api/produits?categorieId=) : le filtre
 * est appliqué côté client et noté comme limite. Pas de suggestions, donc pas de debounce.
 */
@Component({
  selector: 'app-recherche-produit',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="recherche" role="search" (ngSubmit)="soumettre()">
      <label [for]="id" class="sr-only">Rechercher un produit</label>
      <app-icon name="search" />
      <input [id]="id" name="q" type="search" placeholder="Rechercher un produit…"
             autocomplete="off" maxlength="100" [ngModel]="terme()" (ngModelChange)="terme.set($event)" />
      <button type="submit" class="recherche__bouton">Rechercher</button>
    </form>
  `,
  styles: `
    .recherche { position: relative; display: flex; align-items: center; width: 100%; color: var(--color-text-muted); }
    .recherche app-icon { position: absolute; left: var(--space-3); pointer-events: none; }
    .recherche input {
      width: 100%; height: 44px; padding: 0 118px 0 44px;
      border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm);
      background: var(--color-surface); color: var(--color-text); font: 400 16px var(--font-text);
    }
    .recherche input:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .recherche__bouton {
      position: absolute; right: 4px; min-height: 36px; padding: 0 var(--space-3);
      border: 0; border-radius: var(--radius-sm); background: var(--color-primary); color: var(--color-text-on-dark);
      font: 600 14px var(--font-text); cursor: pointer; white-space: nowrap;
    }
    .recherche__bouton:hover { background: var(--color-primary-strong); }
    .recherche__bouton:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  `,
})
export class RechercheProduitComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected terme = signal('');
  // Plusieurs instances cohabitent dans l'en-tête (bureau, tablette, mobile) : id unique.
  protected readonly id = `recherche-produit-${++compteurRecherche}`;

  constructor() {
    // Le champ suit le q de l'URL (recherche lancée ailleurs, bouton retour).
    this.route.queryParams.subscribe(params => {
      const q = typeof params['q'] === 'string' ? params['q'] : '';
      if (q !== this.terme()) this.terme.set(q);
    });
  }

  protected soumettre(): void {
    const q = nettoyer(this.terme());
    if (!q) {
      if (this.estCatalogue()) this.router.navigate([], { queryParams: { q: null }, queryParamsHandling: 'merge', replaceUrl: true });
      return;
    }
    if (this.estCatalogue()) {
      this.router.navigate([], { queryParams: { q }, queryParamsHandling: 'merge', replaceUrl: true });
    } else {
      this.router.navigate(['/'], { queryParams: { q } });
    }
  }

  private estCatalogue(): boolean {
    return this.router.url.split('?')[0] === '/';
  }
}

/** Espaces normalisés, chaîne vide si rien d'exploitable (champ vide ignoré). */
export function nettoyer(terme: string): string {
  return terme.trim().replace(/\s+/g, ' ');
}

let compteurRecherche = 0;
