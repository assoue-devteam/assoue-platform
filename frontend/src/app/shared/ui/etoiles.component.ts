import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Note sur 5 en étoiles. N'affiche rien sans avis : pas d'étoiles vides qui feraient croire à une mauvaise note. */
@Component({
  selector: 'app-etoiles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (nombre() > 0 && note() !== null) {
      <span class="etoiles" [attr.aria-label]="libelle()" role="img">
        <span class="etoiles__fond" aria-hidden="true">★★★★★<span class="etoiles__plein" [style.width.%]="(note()! / 5) * 100">★★★★★</span></span>
        @if (!seule()) { <span class="etoiles__texte" aria-hidden="true">{{ noteAffichee() }} ({{ nombre() }} avis)</span> }
      </span>
    }
  `,
  styles: `
    .etoiles { display: inline-flex; align-items: center; gap: var(--space-2); font-size: 14px; color: var(--color-text-muted); }
    .etoiles__fond { position: relative; display: inline-block; color: var(--color-border-strong); letter-spacing: 1px; line-height: 1; }
    .etoiles__plein { position: absolute; inset: 0 auto 0 0; overflow: hidden; white-space: nowrap; color: var(--color-accent-soft); }
  `,
})
export class EtoilesComponent {
  readonly note = input<number | null>(null);
  readonly nombre = input(0);
  // Pour un avis individuel : les étoiles sans moyenne ni nombre d'avis.
  readonly seule = input(false);
  protected noteAffichee = computed(() => (this.note() ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 }));
  protected libelle = computed(() => this.seule() ? `Note ${this.noteAffichee()} sur 5` : `Note ${this.noteAffichee()} sur 5, ${this.nombre()} avis`);
}
