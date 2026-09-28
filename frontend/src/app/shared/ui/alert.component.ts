import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from './icon/icon.component';
import { IconName } from './icon/icons';
import { Ton } from '../models/statuts';

const ICONE_PAR_TON: Record<Exclude<Ton, 'neutre'>, IconName> = {
  success: 'check',
  warning: 'alert-triangle',
  error: 'alert-circle',
  info: 'info',
};

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "'alert alert--' + tone() + (banner() ? ' alert--banner' : '')",
    '[attr.role]': "tone() === 'error' ? 'alert' : 'status'",
  },
  template: `
    <app-icon [name]="icone()" />
    <div class="alert__corps">
      @if (titre()) { <strong class="alert__titre">{{ titre() }}</strong> }
      <ng-content />
    </div>
    @if (fermable()) {
      <button type="button" class="alert__fermer" aria-label="Fermer" (click)="ferme.emit()">
        <app-icon name="x" />
      </button>
    }
  `,
  styles: `
    :host {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); font-size: 15px;
    }
    :host(.alert--banner) { border-radius: 0; }
    :host(.alert--success) { background: var(--color-success-bg); color: var(--color-success); }
    :host(.alert--warning) { background: var(--color-warning-bg); color: var(--color-warning); }
    :host(.alert--error) { background: var(--color-error-bg); color: var(--color-error); }
    :host(.alert--info) { background: var(--color-info-bg); color: var(--color-info); }
    .alert__corps { flex: 1; }
    .alert__titre { display: block; }
    .alert__fermer {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 44px; min-height: 44px; margin: calc(-1 * var(--space-3)) calc(-1 * var(--space-3)) 0 0;
      border: 0; background: transparent; color: inherit; cursor: pointer;
    }
  `,
})
export class AlertComponent {
  tone = input<Exclude<Ton, 'neutre'>>('info');
  titre = input<string>();
  banner = input(false);
  fermable = input(false);
  ferme = output<void>();

  protected icone = computed(() => ICONE_PAR_TON[this.tone()]);
}
