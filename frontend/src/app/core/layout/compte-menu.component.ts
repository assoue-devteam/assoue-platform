import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';

// Email seul : le backend ne renvoie ni nom ni prénom à la connexion (GAP-06).
@Component({
  selector: 'app-compte-menu',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="compte">
      <summary class="compte__bouton">
        <span class="compte__avatar" aria-hidden="true">{{ initiale() }}</span>
        <span class="compte__email">{{ auth.email() }}</span>
        <app-icon name="chevron-down" [size]="16" />
      </summary>
      <div class="compte__menu">
        @if (auth.aRole('ADMIN')) { <a routerLink="/gestion">Espace gestion</a> }
        @if (auth.aRole('COLLECTEUR')) { <a routerLink="/collecte">Espace collecte</a> }
        @if (auth.aRole('CLIENT')) { <a routerLink="/commandes">Mes commandes</a> }
        <button type="button" (click)="deconnecter()"><app-icon name="log-out" [size]="16" /> Se déconnecter</button>
      </div>
    </details>
  `,
  styles: `
    .compte { position: relative; }
    .compte__bouton {
      display: flex; align-items: center; gap: var(--space-2); min-height: 44px; padding: 0 var(--space-2);
      list-style: none; cursor: pointer; border-radius: var(--radius-sm);
    }
    .compte__bouton::-webkit-details-marker { display: none; }
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
  `,
})
export class CompteMenuComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  protected initiale = () => this.auth.email()?.charAt(0) ?? '';

  protected deconnecter() {
    this.auth.deconnecter();
    this.router.navigateByUrl('/');
  }
}
