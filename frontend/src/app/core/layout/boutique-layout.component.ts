import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NetworkService } from '../network.service';
import { CompteMenuComponent } from './compte-menu.component';
import { SiteFooterComponent } from './site-footer.component';
import { AlertComponent } from '../../shared/ui/alert.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PanierService } from '../../features/catalogue/panier.service';

@Component({
  selector: 'app-boutique-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CompteMenuComponent, AlertComponent, IconComponent, SiteFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="entete">
      <div class="container entete__ligne">
        <a routerLink="/" class="logo"><img src="logo-assoue.png" alt="AS'SOUÉ, accueil de la boutique" width="119" height="44" /></a>

        <nav class="entete__nav" aria-label="Navigation principale" [class.entete__nav--ouverte]="menuOuvert()">
          <a routerLink="/" routerLinkActive="actif" [routerLinkActiveOptions]="{ exact: true }" (click)="menuOuvert.set(false)">Catalogue</a>
          @if (auth.aRole('CLIENT')) {
            <a routerLink="/commandes" routerLinkActive="actif" (click)="menuOuvert.set(false)">Mes commandes</a>
          }
          @if (!auth.connecte()) {
            <a routerLink="/connexion" class="mobile-seul" (click)="menuOuvert.set(false)">Se connecter</a>
          }
        </nav>

        <div class="entete__actions">
          <a routerLink="/panier" routerLinkActive="actif" class="entete__panier">
            <app-icon name="shopping-bag" /> Panier
            @if (panier.nombreArticles()) { <span class="entete__compteur">{{ panier.nombreArticles() }}</span> }
          </a>
          @if (auth.connecte()) {
            <app-compte-menu />
          } @else {
            <a routerLink="/connexion" class="entete__connexion">Se connecter</a>
          }
          <button type="button" class="entete__menu" [attr.aria-expanded]="menuOuvert()" (click)="menuOuvert.set(!menuOuvert())">
            <app-icon name="menu" /> Menu
          </button>
        </div>
      </div>
    </header>

    @if (!reseau.enLigne()) {
      <app-alert tone="warning" [banner]="true">Pas de connexion. Le catalogue affiché peut être ancien.</app-alert>
    }

    <main id="contenu"><router-outlet /></main>
    <app-site-footer />
  `,
  styles: `
    .entete { background: var(--color-surface); border-bottom: 1px solid var(--color-border); }
    .entete__ligne { display: flex; align-items: center; gap: var(--space-5); min-height: 64px; flex-wrap: wrap; }
    .logo { display: inline-flex; align-items: center; min-height: 44px; }
    .logo img { height: 44px; width: auto; }
    .entete__nav { display: flex; gap: var(--space-4); }
    .entete__nav a, .entete__panier, .entete__connexion {
      display: inline-flex; align-items: center; gap: var(--space-2); min-height: 44px;
      color: var(--color-text); text-decoration: none; font-weight: 600;
    }
    .entete__nav a.actif, .entete__panier.actif { color: var(--color-primary); box-shadow: inset 0 -2px var(--color-primary); }
    .entete__actions { display: flex; align-items: center; gap: var(--space-3); margin-left: auto; }
    .entete__compteur { display:inline-grid; place-items:center; min-width:20px; height:20px; padding-inline:4px; border-radius:var(--radius-sm); background:var(--color-primary-strong); color:var(--color-text-on-dark); font-size:13px; font-variant-numeric:tabular-nums; }
    .entete__menu {
      display: none; align-items: center; gap: var(--space-1); min-height: 44px; padding: 0 var(--space-2);
      border: 0; background: none; color: var(--color-text); font: 600 15px var(--font-text); cursor: pointer;
    }
    .mobile-seul { display: none !important; }
    @media (max-width: 767px) {
      .entete__ligne { gap: var(--space-3); }
      .logo img { height: 36px; }
      .entete__actions { gap: var(--space-1); }
      .entete__connexion { display: none; }
      .mobile-seul { display: inline-flex !important; }
      .entete__menu { display: inline-flex; }
      .entete__nav { display: none; order: 3; width: 100%; flex-direction: column; gap: 0; padding-bottom: var(--space-2); }
      .entete__nav--ouverte { display: flex; }
    }
  `,
})
export class BoutiqueLayoutComponent {
  protected auth = inject(AuthService);
  protected reseau = inject(NetworkService);
  protected panier = inject(PanierService);
  protected menuOuvert = signal(false);
}
