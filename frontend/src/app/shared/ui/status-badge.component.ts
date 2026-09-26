import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from './icon/icon.component';
import { statutAffiche } from '../models/statuts';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="'badge--' + statut().ton">
      <app-icon [name]="statut().icone" [size]="16" />
      {{ statut().libelle }}
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex; align-items: center; gap: var(--space-1);
      padding: 2px var(--space-2); border-radius: var(--radius-sm);
      font-size: 13px; font-weight: 600; line-height: 1.4; white-space: nowrap;
    }
    .badge--neutre { background: var(--color-surface-alt); color: var(--color-text); }
    .badge--success { background: var(--color-success-bg); color: var(--color-success); }
    .badge--warning { background: var(--color-warning-bg); color: var(--color-warning); }
    .badge--error { background: var(--color-error-bg); color: var(--color-error); }
    .badge--info { background: var(--color-info-bg); color: var(--color-info); }
  `,
})
export class StatusBadgeComponent {
  code = input.required<string>();
  protected statut = computed(() => statutAffiche(this.code()));
}
