import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from './icon/icon.component';
import { ButtonDirective } from './button.directive';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @for (_ of lignesTableau(); track $index) {
      <span class="ligne" [style.width]="$last && lignes() > 1 ? '60%' : '100%'"></span>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--space-2); }
    .ligne { display: block; height: 14px; border-radius: var(--radius-sm); background: var(--color-surface-alt); }
  `,
})
export class SkeletonComponent {
  lignes = input(3);
  protected lignesTableau = computed(() => Array.from({ length: this.lignes() }));
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="message">{{ message() }}</p>
    <ng-content />
  `,
  styles: `
    :host { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-7) var(--space-4); text-align: center; }
    .message { color: var(--color-text-muted); }
  `,
})
export class EmptyStateComponent {
  message = input.required<string>();
}

export type TypeErreur = 'reseau' | 'serveur' | 'introuvable' | 'interdit';

const MESSAGES: Record<TypeErreur, { titre: string; texte: string }> = {
  reseau: { titre: 'Pas de connexion', texte: 'Vérifiez votre connexion internet puis réessayez.' },
  serveur: { titre: 'Un problème est survenu', texte: 'Le service ne répond pas correctement. Réessayez dans quelques instants.' },
  introuvable: { titre: 'Page introuvable', texte: "Cette page n'existe pas ou n'est plus disponible." },
  interdit: { titre: 'Accès refusé', texte: "Cet espace n'est pas accessible avec votre compte." },
};

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [IconComponent, ButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'alert' },
  template: `
    <app-icon name="alert-circle" [size]="24" />
    <h2>{{ titre() ?? contenu().titre }}</h2>
    <p class="texte">{{ texte() ?? contenu().texte }}</p>
    @if (reessayable()) {
      <button type="button" appButton="secondary" (click)="reessayer.emit()">
        <app-icon name="refresh-cw" /> Réessayer
      </button>
    }
    <ng-content />
  `,
  styles: `
    :host { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-7) var(--space-4); text-align: center; color: var(--color-text); }
    app-icon { color: var(--color-error); }
    .texte { color: var(--color-text-muted); max-width: 42ch; }
  `,
})
export class ErrorStateComponent {
  type = input<TypeErreur>('serveur');
  titre = input<string>();
  texte = input<string>();
  reessayable = input(false);
  reessayer = output<void>();

  protected contenu = computed(() => MESSAGES[this.type()]);
}
