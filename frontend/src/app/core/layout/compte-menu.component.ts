import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';
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
          @if (auth.aRole('ADMIN')) { <a routerLink="/gestion" (click)="fermer()">Espace gestion</a> }
          @if (auth.aRole('COLLECTEUR')) { <a routerLink="/collecte" (click)="fermer()">Espace collecte</a> }
          @if (auth.aRole('CLIENT')) { <a routerLink="/commandes" (click)="fermer()">Mes commandes</a> }
          @if (auth.aRole('CLIENT')) { <a routerLink="/favoris" (click)="fermer()">Mes favoris</a> }
          <button type="button" (click)="deconnecter()"><app-icon name="log-out" [size]="16" /> Se déconnecter</button>
        </div>
      }
    </div>
  `,
  styles: `
    .compte { position: relative; }
    .compte__bouton {
      display: flex; align-items: center; gap: var(--space-2); min-height: 44px; padding: 0 var(--space-2);
      border: 0; background: none; color: inherit; font: inherit; cursor: pointer; border-radius: var(--radius-sm);
    }
    .compte__avatar {
      display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px;
      border-radius: var(--radius-full); background: var(--color-primary-tint); color: var(--color-primary-strong);
      font-weight: 600; text-transform: uppercase;
    }
    .compte__email { max-width: 22ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
    @media (max-width: 599px) { .compte__email { display: none; } }
    .compte__menu {
      position: absolute; right: 0; top: calc(100% + var(--space-1)); z-index: 20; min-width: 220px;
      display: flex; flex-direction: column; padding: var(--space-2) 0;
      background: var(--color-surface); color: var(--color-text);
      border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-1);
    }
    .compte__menu a, .compte__menu button {
      display: flex; align-items: center; gap: var(--space-2); min-height: 44px; padding: 0 var(--space-4);
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
    this.fermer();
    this.auth.deconnecter();
    this.router.navigateByUrl('/');
  }
}
