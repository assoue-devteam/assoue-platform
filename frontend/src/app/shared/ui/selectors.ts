import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconComponent } from './icon/icon.component';

export interface Option<T = string> {
  valeur: T;
  libelle: string;
}

@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stepper" role="group" [attr.aria-label]="label()">
      <button type="button" aria-label="Diminuer" [disabled]="disabled() || value() <= min()" (click)="value.set(value() - 1)">
        <app-icon name="minus" />
      </button>
      <output class="valeur num" aria-live="polite">{{ value() }}</output>
      <button type="button" aria-label="Augmenter" [disabled]="disabled()" (click)="value.set(value() + 1)">
        <app-icon name="plus" />
      </button>
    </div>
  `,
  styles: `
    .stepper { display: inline-flex; align-items: center; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface); }
    button {
      display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px;
      border: 0; background: transparent; color: var(--color-primary); cursor: pointer;
    }
    button:disabled { color: var(--color-border-strong); cursor: not-allowed; }
    .valeur { min-width: 40px; text-align: center; font-weight: 600; }
  `,
})
export class QuantityStepperComponent {
  // Pas de max : le stock restant n'est pas exposé par le backend (GAP-10).
  value = model(1);
  min = input(1);
  disabled = input(false);
  label = input('Quantité');
}

@Component({
  selector: 'app-filter-chips',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chips" role="group" [attr.aria-label]="label()">
      @for (option of options(); track option.valeur) {
        <button type="button" class="chip" [attr.aria-pressed]="option.valeur === selected()" (click)="selected.set(option.valeur)">
          {{ option.libelle }}
        </button>
      }
    </div>
  `,
  styles: `
    .chips { display: flex; gap: var(--space-2); overflow-x: auto; padding-bottom: var(--space-1); }
    .chip {
      flex-shrink: 0; min-height: 44px; padding: 0 var(--space-4);
      border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm);
      background: var(--color-surface); color: var(--color-text); font: 600 15px var(--font-text); cursor: pointer;
    }
    .chip[aria-pressed="true"] { background: var(--color-primary-strong); border-color: var(--color-primary-strong); color: var(--color-text-on-dark); }
  `,
})
export class FilterChipsComponent<T = string> {
  options = input.required<Option<T>[]>();
  selected = model<T>();
  label = input.required<string>();
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs" role="tablist" [attr.aria-label]="label()" (keydown)="clavier($event)">
      @for (option of options(); track option.valeur) {
        <button type="button" role="tab" class="tab"
                [attr.aria-selected]="option.valeur === selected()"
                [attr.tabindex]="option.valeur === selected() ? 0 : -1"
                (click)="selected.set(option.valeur)">
          {{ option.libelle }}
        </button>
      }
    </div>
  `,
  styles: `
    .tabs { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--color-border); overflow-x: auto; }
    .tab {
      flex-shrink: 0; min-height: 44px; padding: 0 var(--space-4); border: 0; border-bottom: 2px solid transparent;
      background: transparent; color: var(--color-text-muted); font: 600 15px var(--font-text); cursor: pointer;
    }
    .tab[aria-selected="true"] { color: var(--color-primary-strong); border-bottom-color: var(--color-primary-strong); }
  `,
})
export class TabsComponent<T = string> {
  options = input.required<Option<T>[]>();
  selected = model<T>();
  label = input.required<string>();

  protected clavier(event: KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const opts = this.options();
    const i = opts.findIndex(o => o.valeur === this.selected());
    const suivant = opts[(i + (event.key === 'ArrowRight' ? 1 : -1) + opts.length) % opts.length];
    this.selected.set(suivant.valeur);
    const tabs = (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]');
    tabs[opts.indexOf(suivant)]?.focus();
  }
}
