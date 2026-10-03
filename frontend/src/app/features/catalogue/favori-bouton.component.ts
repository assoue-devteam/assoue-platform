import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Produit } from '../../shared/models/api';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { FavorisService } from './favoris.service';

@Component({
  selector: 'app-favori-bouton',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="favori" [class.favori--actif]="actif()" [attr.aria-pressed]="actif()"
            [attr.aria-label]="(actif() ? 'Retirer ' : 'Ajouter ') + produit().nom + (actif() ? ' des favoris' : ' aux favoris')"
            (click)="$event.preventDefault(); $event.stopPropagation(); favoris.basculer(produit())">
      <app-icon name="heart" />
    </button>
  `,
  styles: `
    .favori {
      display: grid; place-items: center; width: 40px; height: 40px; padding: 0;
      border: 0; border-radius: var(--radius-full); background: rgba(255, 255, 255, .92);
      color: var(--color-text); cursor: pointer; box-shadow: var(--shadow-1);
    }
    .favori:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .favori--actif { color: var(--color-logo); }
    .favori--actif ::ng-deep svg { fill: currentColor; }
  `,
})
export class FavoriBoutonComponent {
  protected favoris = inject(FavorisService);
  readonly produit = input.required<Produit>();
  protected actif = computed(() => this.favoris.estFavori(this.produit().id));
}
