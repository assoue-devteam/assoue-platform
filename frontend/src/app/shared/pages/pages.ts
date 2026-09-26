import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorStateComponent } from '../ui/states';
import { ButtonDirective } from '../ui/button.directive';
import { AuthService } from '../../core/auth/auth.service';

/** Écran pas encore réalisé : le titre vient de data.titre de la route. À remplacer par la piste concernée. */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      <h1>{{ titre() }}</h1>
      <p class="text-muted">Écran en cours de réalisation.</p>
    </div>
  `,
  styles: `.page { padding-block: var(--space-6); display: grid; gap: var(--space-2); }`,
})
export class PageProvisoireComponent {
  titre = input('');
}

@Component({
  standalone: true,
  imports: [ErrorStateComponent, RouterLink, ButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-error-state type="introuvable">
      <a appButton="secondary" routerLink="/">Retour au catalogue</a>
    </app-error-state>
  `,
})
export class PageIntrouvableComponent {}

@Component({
  standalone: true,
  imports: [ErrorStateComponent, RouterLink, ButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-error-state type="interdit">
      <a appButton="secondary" [routerLink]="auth.espaceParDefaut()">Aller à mon espace</a>
    </app-error-state>
  `,
})
export class PageAccesRefuseComponent {
  protected auth = inject(AuthService);
}
