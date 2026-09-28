import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS, IconName } from './icons';

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
         [attr.width]="size()" [attr.height]="size()"
         [attr.aria-hidden]="label() ? null : 'true'" [attr.aria-label]="label()"
         [attr.role]="label() ? 'img' : null"
         [innerHTML]="contenu()"></svg>
  `,
  styles: `:host { display: inline-flex; flex-shrink: 0; }`,
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);

  name = input.required<IconName>();
  size = input<16 | 20 | 24>(20);
  // Sans label, l'icône est décorative : le texte à côté porte le sens.
  label = input<string | null>(null);

  // Contenu statique défini dans icons.ts, jamais issu d'une donnée utilisateur.
  protected contenu = computed(() => this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()]));
}
