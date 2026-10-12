import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ClickOutsideDirective, estDefilementFermant } from '../../shared/ui/click-outside.directive';

// Sidebar fixe dès 1024px ; en dessous, barre haute « Menu » + panneau par-dessus le contenu (DS §5).
// Seuls les écrans P0 sont listés ; À traiter, Volumes et Paiements viendront avec leurs écrans (P1).
@Component({
  selector: 'app-gestion-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ClickOutsideDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'space-gestion' },
  template: `
    <header class="barre">
      <button type="button" #boutonMenu class="barre__menu" [attr.aria-expanded]="menuOuvert()" aria-controls="nav-gestion"
              (click)="menuOuvert.set(true)">
        <app-icon name="menu" /> Menu
      </button>
      <span class="barre__titre">AS'SOUÉ Gestion</span>
    </header>

    @if (menuOuvert()) { <button type="button" class="voile" aria-label="Fermer le menu" (click)="fermer()"></button> }

    <nav #panneau id="nav-gestion" class="sidebar" [class.sidebar--ouverte]="menuOuvert()" aria-label="Navigation gestion"
         [appClickOutsideEnabled]="menuOuvert()" (appClickOutside)="fermerDepuisExterieur($event)"
         (focusout)="fermerSiFocusSorti($event)" (window:scroll)="fermerSiDefilementExterieur($event)">
      <div class="sidebar__entete">
        <span class="sidebar__marque"><img src="logo-assoue.png" alt="AS'SOUÉ" width="108" height="40" /></span>
        <button type="button" class="sidebar__fermer" aria-label="Fermer le menu" (click)="menuOuvert.set(false)">
          <app-icon name="x" />
        </button>
      </div>
      <ul>
        @for (lien of liens; track lien.url) {
          <li><a [routerLink]="lien.url" routerLinkActive="actif" (click)="menuOuvert.set(false)">{{ lien.libelle }}</a></li>
        }
      </ul>
      <div class="sidebar__pied">
        <span class="sidebar__email">{{ auth.email() }}</span>
        <a routerLink="/" (click)="fermer()">Voir la boutique</a>
        <button type="button" (click)="deconnecter()"><app-icon name="log-out" [size]="16" /> Se déconnecter</button>
      </div>
    </nav>

    <main id="contenu" class="contenu"><router-outlet /></main>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .barre {
      display: flex; align-items: center; gap: var(--space-3); min-height: 56px; padding: 0 var(--space-4);
      background: var(--color-primary-strong); color: var(--color-text-on-dark);
    }
    .barre__menu {
      display: inline-flex; align-items: center; gap: var(--space-1); min-height: 44px; padding: 0 var(--space-2);
      border: 0; background: none; color: inherit; font: 600 15px var(--font-text); cursor: pointer; border-radius: var(--radius-sm);
    }
    .barre__menu:focus-visible, .sidebar a:focus-visible, .sidebar button:focus-visible {
      outline: none; box-shadow: var(--focus-ring);
    }
    .barre__titre { font-weight: 600; }
    .voile { position: fixed; inset: 0; z-index: 20; border: 0; padding: 0; background: var(--overlay); cursor: pointer; }
    .sidebar {
      position: fixed; z-index: 21; inset: 0 auto 0 0; width: 280px; max-width: 85vw;
      display: none; flex-direction: column; overflow-y: auto;
      background: var(--color-primary-strong); color: var(--color-text-on-dark);
    }
    .sidebar--ouverte { display: flex; }
    .sidebar__entete { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); }
    .sidebar__marque { padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); background: var(--color-surface); }
    .sidebar__marque img { height: 32px; width: auto; }
    .sidebar__fermer {
      display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px;
      border: 0; background: none; color: inherit; cursor: pointer;
    }
    ul { list-style: none; margin: 0; padding: 0 var(--space-2); flex: 1; }
    .sidebar a, .sidebar button {
      display: flex; align-items: center; gap: var(--space-2); min-height: 44px; padding: 0 var(--space-3);
      border: 0; border-radius: var(--radius-sm); background: none; color: inherit; font: 600 15px var(--font-text);
      text-decoration: none; cursor: pointer; width: 100%; text-align: left;
    }
    .sidebar a:hover, .sidebar button:hover { background: rgba(255, 255, 255, .08); color: inherit; }
    .sidebar a.actif { background: rgba(255, 255, 255, .16); }
    .sidebar__pied { display: grid; gap: var(--space-1); padding: var(--space-4) var(--space-2); border-top: 1px solid rgba(255, 255, 255, .16); }
    .sidebar__email { padding: 0 var(--space-3); font-size: 13px; opacity: .85; overflow-wrap: anywhere; }
    .contenu { padding: var(--space-5) var(--space-4); max-width: 1440px; }

    @media (min-width: 1024px) {
      .barre, .voile, .sidebar__fermer { display: none; }
      .sidebar { display: flex; width: 240px; }
      .contenu { margin-left: 240px; padding: var(--space-6); }
    }
  `,
})
export class GestionLayoutComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private boutonMenu = viewChild<ElementRef<HTMLButtonElement>>('boutonMenu');
  private panneau = viewChild<ElementRef<HTMLElement>>('panneau');
  protected menuOuvert = signal(false);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart), takeUntilDestroyed())
      .subscribe(() => this.fermer());
  }

  /** Le bouton Menu est hors du panneau : on l’ignore, c’est lui qui ouvre. */
  protected fermerDepuisExterieur(event: PointerEvent | KeyboardEvent): void {
    if (!this.menuOuvert()) return;
    if (event instanceof PointerEvent && this.boutonMenu()?.nativeElement.contains(event.target as Node)) return;
    this.fermer();
    if (event instanceof KeyboardEvent) this.boutonMenu()?.nativeElement.focus();
  }

  protected fermerSiFocusSorti(event: FocusEvent): void {
    const cible = event.relatedTarget as Node | null;
    if (!cible || !(event.currentTarget as HTMLElement).contains(cible)) this.fermer();
  }

  protected fermerSiDefilementExterieur(event: Event): void {
    const zone = this.panneau()?.nativeElement;
    if (zone && estDefilementFermant(event, zone)) this.fermer();
  }

  protected fermer(): void {
    this.menuOuvert.set(false);
  }

  protected liens = [
    { url: '/gestion/collectes', libelle: 'Collectes' },
    { url: '/gestion/commandes', libelle: 'Commandes' },
    { url: '/gestion/produits', libelle: 'Produits' },
    { url: '/gestion/stocks', libelle: 'Stocks' },
    { url: '/gestion/communaute', libelle: 'Communauté' },
    { url: '/gestion/utilisateurs', libelle: 'Utilisateurs' },
  ];

  protected deconnecter() {
    this.auth.deconnecter();
    this.router.navigateByUrl('/');
  }
}
