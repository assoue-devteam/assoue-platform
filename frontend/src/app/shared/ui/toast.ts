import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { IconComponent } from './icon/icon.component';

export interface Toast {
  id: number;
  ton: 'success' | 'error';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private prochainId = 0;

  succes(message: string) {
    const id = ++this.prochainId;
    this.toasts.update(t => [...t, { id, ton: 'success', message }]);
    setTimeout(() => this.fermer(id), 5000);
  }

  // Les erreurs restent jusqu'à fermeture : on ne fait pas disparaître un problème.
  erreur(message: string) {
    this.toasts.update(t => [...t, { id: ++this.prochainId, ton: 'error', message }]);
  }

  fermer(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}

/** Rendu une seule fois dans AppComponent. */
@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of service.toasts(); track toast.id) {
        <div class="toast" [class.toast--error]="toast.ton === 'error'" [attr.role]="toast.ton === 'error' ? 'alert' : null">
          <app-icon [name]="toast.ton === 'error' ? 'alert-circle' : 'check'" />
          <span class="toast__texte">{{ toast.message }}</span>
          <button type="button" class="toast__fermer" aria-label="Fermer" (click)="service.fermer(toast.id)">
            <app-icon name="x" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed; z-index: 30; left: var(--space-4); right: var(--space-4); bottom: var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-2); pointer-events: none;
    }
    @media (min-width: 600px) { .toasts { left: auto; width: 380px; } }
    .toast {
      display: flex; align-items: center; gap: var(--space-3); pointer-events: auto;
      padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
      background: var(--color-success-bg); color: var(--color-success);
      border-radius: var(--radius-md); box-shadow: var(--shadow-2);
    }
    .toast--error { background: var(--color-error-bg); color: var(--color-error); }
    .toast__texte { flex: 1; }
    .toast__fermer {
      display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px;
      border: 0; background: transparent; color: inherit; cursor: pointer;
    }
  `,
})
export class ToastsComponent {
  protected service = inject(ToastService);
}
