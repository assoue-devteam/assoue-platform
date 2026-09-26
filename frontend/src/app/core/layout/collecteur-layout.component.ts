import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NetworkService } from '../network.service';
import { CompteMenuComponent } from './compte-menu.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

// Mobile uniquement : barre haute + navigation basse à 2 entrées (DS §7).
// L'indicateur de synchronisation détaillé (file d'envoi) arrive avec la piste Collecte.
@Component({
  selector: 'app-collecteur-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CompteMenuComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'space-collecteur' },
  template: `
    <header class="barre">
      <span class="barre__titre">AS'SOUÉ Collecte</span>
      <span class="reseau" aria-live="polite">
        @if (reseau.enLigne()) {
          <app-icon name="wifi" [size]="16" /> En ligne
        } @else {
          <app-icon name="cloud-off" [size]="16" /> Hors ligne
        }
      </span>
      <app-compte-menu />
    </header>

    <main id="contenu" class="contenu"><router-outlet /></main>

    <nav class="bas" aria-label="Navigation collecte">
      <a routerLink="/collecte/nouvelle" routerLinkActive="actif"><app-icon name="plus" /> Déclarer</a>
      <a routerLink="/collecte" routerLinkActive="actif" [routerLinkActiveOptions]="{ exact: true }"><app-icon name="package" /> Mes collectes</a>
    </nav>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100dvh; }
    .barre {
      position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: var(--space-3);
      min-height: 56px; padding: 0 var(--space-4); background: var(--color-primary-strong); color: var(--color-text-on-dark);
    }
    .barre__titre { font-weight: 600; flex: 1; }
    .reseau { display: inline-flex; align-items: center; gap: var(--space-1); font-size: 14px; }
    .barre app-compte-menu { color: var(--color-text-on-dark); }
    .contenu { flex: 1; padding: var(--space-4); max-width: 560px; width: 100%; margin-inline: auto; }
    .bas {
      position: sticky; bottom: 0; display: grid; grid-template-columns: 1fr 1fr;
      background: var(--color-surface); border-top: 1px solid var(--color-border);
    }
    .bas a {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
      min-height: 56px; color: var(--color-text-muted); text-decoration: none; font-size: 14px; font-weight: 600;
    }
    .bas a.actif { color: var(--color-primary-strong); box-shadow: inset 0 3px var(--color-primary-strong); }
  `,
})
export class CollecteurLayoutComponent {
  protected reseau = inject(NetworkService);
}
