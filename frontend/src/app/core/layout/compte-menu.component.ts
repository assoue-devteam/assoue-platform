import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CollecteService } from '../../features/collecte/collecte.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ClickOutsideDirective, estDefilementFermant } from '../../shared/ui/click-outside.directive';
import { PopupService } from '../../shared/ui/popup.service';

let compteur = 0;

// Motif « disclosure » (simple liste de liens dans un panneau) : pas de role="menu",
// donc pas de navigation aux flèches à gérer. Email seul : le backend ne renvoie
// ni nom ni prénom à la connexion (GAP-06).
@Component({
  selector: 'app-compte-menu',
  standalone: true,
  imports: [RouterLink, IconComponent, ClickOutsideDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="compte" [appClickOutsideEnabled]="ouvert()" (appClickOutside)="fermerDepuisExterieur($event)" (window:scroll)="fermerSiDefilementExterieur($event)">
      <button #declencheur type="button" class="compte__bouton" [attr.aria-expanded]="ouvert()"
              [attr.aria-controls]="idPanneau" (click)="basculer()">
        <span class="compte__avatar" aria-hidden="true">{{ initiale() }}</span>
        <span class="compte__email">{{ auth.email() }}</span>
        <app-icon name="chevron-down" [size]="16" />
      </button>
      @if (ouvert()) {
        <div class="compte__menu" [id]="idPanneau" (focusout)="fermerSiFocusSorti($event)">
          <p class="compte__email-complet">{{ auth.email() }}</p>
          @if (auth.aRole('ADMIN')) { <a routerLink="/gestion" (click)="fermer()">Espace gestion</a> }
          @if (auth.aRole('COLLECTEUR')) {
            <a routerLink="/collecte" (click)="fermer()">Espace collecte</a>
            <a routerLink="/" (click)="fermer()">Boutique</a>
          }
          @if (auth.aRole('CLIENT') || auth.aRole('COLLECTEUR')) { <a routerLink="/commandes" (click)="fermer()">Mes commandes</a> }
          @if (auth.aRole('CLIENT') || auth.aRole('COLLECTEUR')) { <a routerLink="/favoris" (click)="fermer()">Mes favoris</a> }
          @if (auth.aRole('CLIENT') || auth.aRole('COLLECTEUR')) { <a routerLink="/signalements" (click)="fermer()">🪙 Signalements & Points</a> }
          <button type="button" (click)="deconnecter()"><app-icon name="log-out" [size]="16" /> Se déconnecter</button>
        </div>
      }
    </div>
  `,
  styles: `
    .compte { position: relative; min-width: 0; }
    .compte__bouton {
      display: flex; align-items: center; gap: var(--space-2); min-height: 2.75rem; min-width: 2.75rem; justify-content: center; padding: 0 var(--space-2);
      border: 0; background: none; color: inherit; font: inherit; cursor: pointer; border-radius: var(--radius-sm);
    }
    .compte__avatar {
      display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem;
      border-radius: var(--radius-full); background: var(--color-primary-tint); color: var(--color-primary-strong);
      font-weight: 600; text-transform: uppercase; flex: none;
    }
    .compte__email { max-width: 22ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.875rem; min-width: 0; }
    @media (max-width: 37.4375rem) { .compte__email { display: none; } }
    .compte__email-complet {
      margin: 0; padding: 0 var(--space-4); min-height: 2.75rem; display: flex; align-items: center;
      font-size: 0.875rem; color: var(--color-text-muted); overflow-wrap: anywhere; border-bottom: 1px solid var(--color-border);
    }
    .compte__menu {
      position: absolute; right: 0; top: calc(100% + var(--space-1)); z-index: 20; min-width: 13.75rem; max-width: calc(100vw - 2rem);
      display: flex; flex-direction: column; padding: var(--space-2) 0;
      background: var(--color-surface); color: var(--color-text);
      border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-1);
    }
    .compte__menu a, .compte__menu button {
      display: flex; align-items: center; gap: var(--space-2); min-height: 2.75rem; padding: 0 var(--space-4);
      border: 0; background: none; color: var(--color-text); font: inherit; text-align: left; text-decoration: none; cursor: pointer;
    }
    .compte__menu a:hover, .compte__menu button:hover { background: var(--color-surface-alt); }
    .compte__bouton:focus-visible, .compte__menu a:focus-visible, .compte__menu button:focus-visible {
      outline: none; box-shadow: var(--focus-ring);
    }
  `,
})
export class CompteMenuComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private popups = inject(PopupService);
  private collecteService = inject(CollecteService, { optional: true });
  private declencheur = viewChild<ElementRef<HTMLButtonElement>>('declencheur');

  protected readonly idPanneau = `menu-compte-${++compteur}`;
  protected ouvert = signal(false);
  private hote = inject(ElementRef<HTMLElement>).nativeElement;

  constructor() {
    // Un seul menu ouvert à la fois : un autre panneau signale son ouverture.
    effect(() => {
      const courant = this.popups.ouvert();
      if (courant !== null && courant !== this.idPanneau && this.ouvert()) this.fermer();
    });
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart), takeUntilDestroyed())
      .subscribe(() => this.fermer());
  }

  protected initiale = () => this.auth.email()?.charAt(0) ?? '';

  protected basculer(): void {
    if (this.ouvert()) this.fermer();
    else {
      this.ouvert.set(true);
      this.popups.signalerOuverture(this.idPanneau);
    }
  }

  protected fermer(): void {
    if (!this.ouvert()) return;
    this.ouvert.set(false);
    this.popups.signalerFermeture(this.idPanneau);
  }

  /** Clic ou appui hors du menu : Échap rend le focus au déclencheur, pas le pointeur. */
  protected fermerDepuisExterieur(event: PointerEvent | KeyboardEvent): void {
    if (!this.ouvert()) return;
    this.fermer();
    if (event instanceof KeyboardEvent) this.declencheur()?.nativeElement.focus();
  }

  /** Tab hors du panneau : on ferme sans voler le focus, déjà parti ailleurs. */
  protected fermerSiFocusSorti(event: FocusEvent): void {
    const cible = event.relatedTarget as Node | null;
    if (!cible || !(event.currentTarget as HTMLElement).contains(cible)) this.fermer();
  }

  /** Scroll de la page uniquement, jamais depuis le panneau ni focus dedans (clavier mobile). */
  protected fermerSiDefilementExterieur(event: Event): void {
    if (estDefilementFermant(event, this.hote)) this.fermer();
  }

  protected deconnecter() {
    if (this.auth.aRole('COLLECTEUR') && (this.collecteService?.enAttente() ?? 0) > 0) {
      const confirmer = window.confirm(
        'Vous avez des déclarations de collecte non synchronisées sur ce téléphone. Elles ne seront pas transmises tant que vous ne vous reconnecterez pas. Voulez-vous vraiment vous déconnecter ?'
      );
      if (!confirmer) return;
    }
    this.fermer();
    this.auth.deconnecter();
    this.router.navigateByUrl('/');
  }
}
