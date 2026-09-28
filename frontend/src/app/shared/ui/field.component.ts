import {
  ChangeDetectionStrategy, Component, Directive, ElementRef, Renderer2, contentChild, effect, inject, input,
} from '@angular/core';
import { IconComponent } from './icon/icon.component';

let compteur = 0;

/** À poser sur le <input>/<select> natif projeté dans <app-field>. */
@Directive({ selector: '[appControl]', standalone: true })
export class ControlDirective {
  readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
}

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="label" [attr.for]="id">{{ label() }}</label>
    <ng-content />
    @if (hint()) { <p class="field__hint" [id]="id + '-aide'">{{ hint() }}</p> }
    @if (error()) {
      <p class="field__erreur" [id]="id + '-erreur'">
        <app-icon name="alert-circle" [size]="16" /> {{ error() }}
      </p>
    }
  `,
  styles: `
    :host { display: block; margin-bottom: var(--space-4); }
    .field__hint { margin-top: var(--space-1); font-size: 13px; color: var(--color-text-muted); }
    .field__erreur {
      display: flex; align-items: center; gap: var(--space-1);
      margin-top: var(--space-1); font-size: 14px; color: var(--color-error);
    }
  `,
})
export class FieldComponent {
  label = input.required<string>();
  hint = input<string>();
  error = input<string | null>();

  protected readonly id = `champ-${++compteur}`;
  private control = contentChild(ControlDirective);

  constructor() {
    const renderer = inject(Renderer2);
    // Relie label, aide et erreur au champ natif sans que chaque écran ait à gérer les ids.
    effect(() => {
      const el = this.control()?.el;
      if (!el) return;
      const decrit = [this.hint() && `${this.id}-aide`, this.error() && `${this.id}-erreur`].filter(Boolean);
      renderer.setAttribute(el, 'id', this.id);
      if (decrit.length) renderer.setAttribute(el, 'aria-describedby', decrit.join(' '));
      else renderer.removeAttribute(el, 'aria-describedby');
      if (this.error()) renderer.setAttribute(el, 'aria-invalid', 'true');
      else renderer.removeAttribute(el, 'aria-invalid');
    });
  }
}
