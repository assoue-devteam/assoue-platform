import {
  ChangeDetectionStrategy, Component, ElementRef, effect, input, model, viewChild,
} from '@angular/core';
import { IconComponent } from './icon/icon.component';

let compteur = 0;

// <dialog> natif : piège du focus, touche Échap et restitution du focus gérés par le navigateur.
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" [attr.aria-labelledby]="id" (close)="open.set(false)" (cancel)="annulerSiBloque($event)">
      <header class="modal__entete">
        <h2 [id]="id">{{ titre() }}</h2>
        @if (!bloquante()) {
          <button type="button" class="modal__fermer" aria-label="Fermer" (click)="open.set(false)">
            <app-icon name="x" />
          </button>
        }
      </header>
      <div class="modal__corps"><ng-content /></div>
      <footer class="modal__actions"><ng-content select="[actions]" /></footer>
    </dialog>
  `,
  styles: `
    .modal {
      width: 100%; max-width: 100%; height: 100%; max-height: 100%; margin: 0; padding: 0;
      border: 0; background: var(--color-surface); color: var(--color-text);
    }
    .modal::backdrop { background: var(--overlay); }
    @media (min-width: 600px) {
      .modal {
        width: min(560px, calc(100% - 48px)); height: auto; max-height: calc(100% - 48px);
        margin: auto; border-radius: var(--radius-md); box-shadow: var(--shadow-2);
      }
    }
    .modal__entete {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
      padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--color-border);
    }
    .modal__fermer {
      display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px;
      border: 0; background: transparent; color: var(--color-text); cursor: pointer;
    }
    .modal__corps { padding: var(--space-5); }
    .modal__actions {
      display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--space-3);
      padding: 0 var(--space-5) var(--space-5);
    }
    .modal__actions:empty { display: none; }
  `,
})
export class ModalComponent {
  titre = input.required<string>();
  open = model(false);
  // Session expirée : l'utilisateur doit se reconnecter, pas fermer.
  bloquante = input(false);

  protected readonly id = `modale-${++compteur}`;
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  protected annulerSiBloque(event: Event) {
    if (this.bloquante()) event.preventDefault();
  }
}
