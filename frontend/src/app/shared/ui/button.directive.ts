import { DestroyRef, Directive, ElementRef, computed, inject, input } from '@angular/core';

export type VarianteBouton = 'primary' | 'purchase' | 'secondary' | 'ghost' | 'danger';

@Directive({
  selector: 'button[appButton], a[appButton]',
  standalone: true,
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'loading() || null',
  },
})
export class ButtonDirective {
  appButton = input<VarianteBouton | ''>('');
  block = input(false);
  small = input(false);
  loading = input(false);

  protected classes = computed(() => {
    const variante = this.appButton() || 'primary';
    return [
      'btn',
      variante !== 'primary' ? `btn--${variante}` : '',
      this.block() ? 'btn--block' : '',
      this.small() ? 'btn--small' : '',
      this.loading() ? 'btn--loading' : '',
    ].filter(Boolean).join(' ');
  });

  constructor() {
    // aria-disabled plutôt que disabled : le bouton garde le focus pendant le chargement.
    // Écouteur en capture pour passer avant les (click) du template : c'est lui qui
    // empêche la double initiation d'un paiement (GAP-04).
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const bloquer = (event: Event) => {
      if (this.loading()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    el.addEventListener('click', bloquer, true);
    inject(DestroyRef).onDestroy(() => el.removeEventListener('click', bloquer, true));
  }
}
