import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ModalComponent } from './shared/ui/modal.component';
import { ToastsComponent } from './shared/ui/toast';
import { ButtonDirective } from './shared/ui/button.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ModalComponent, ToastsComponent, ButtonDirective],
  template: `
    <router-outlet />
    <app-toasts />

    <app-modal titre="Votre session a expiré" [open]="auth.sessionExpiree()" [bloquante]="true">
      <p>Pour votre sécurité, reconnectez-vous pour continuer. Vous reviendrez sur cette page.</p>
      <button actions type="button" appButton (click)="seReconnecter()">Se reconnecter</button>
    </app-modal>
  `,
})
export class AppComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  protected seReconnecter() {
    const url = this.router.url;
    // Déjà sur /connexion : garder le retour d'origine au lieu de boucler sur la page elle-même.
    const retour = url.startsWith('/connexion')
      ? this.router.parseUrl(url).queryParams['retour'] ?? this.auth.espaceParDefaut()
      : url;
    this.auth.deconnecter();
    this.router.navigate(['/connexion'], { queryParams: { retour, raison: 'expiree' } });
  }
}
