import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NetworkService } from '../../core/network.service';
import { messageErreur } from '../../core/http/erreurs';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ControlDirective, FieldComponent } from '../../shared/ui/field.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, ButtonDirective, FieldComponent, ControlDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="auth container"><div class="auth__contenu"><p class="eyebrow">AS'SOUÉ</p><h1>Se connecter</h1>
      @if (raisonExpiree()) { <app-alert tone="warning">Votre session a expiré. Connectez-vous pour continuer.</app-alert> }
      @if (erreur()) { <app-alert tone="error">{{ erreur() }}</app-alert> }
      <form [formGroup]="formulaire" (ngSubmit)="soumettre()" novalidate>
        <app-field label="Adresse e-mail" [error]="erreurChamp('email')"><input appControl class="input" type="email" autocomplete="email" formControlName="email" /></app-field>
        <app-field label="Mot de passe" [error]="erreurChamp('motDePasse')"><input appControl class="input" type="password" autocomplete="current-password" formControlName="motDePasse" /></app-field>
        <button type="submit" appButton [block]="true" [loading]="envoi()" [disabled]="!reseau.enLigne()">Se connecter</button>
      </form>
      @if (!reseau.enLigne()) { <app-alert tone="warning">La connexion nécessite une connexion internet.</app-alert> }
      <p class="auth__lien">Vous n'avez pas de compte ? <a routerLink="/inscription">Créer un compte</a></p>
    </div></section>`,
  styles: `.auth { display:grid; place-items:start center; padding-block:var(--space-7); } .auth__contenu { width:min(100%,440px); display:grid; gap:var(--space-4); } .eyebrow { margin:0; color:var(--color-primary); font-weight:600; } form { display:grid; gap:var(--space-2); } .auth__lien { color:var(--color-text-muted); }`,
})
export class ConnexionPageComponent {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected reseau = inject(NetworkService);
  protected envoi = signal(false);
  protected erreur = signal<string | null>(null);
  protected raisonExpiree = signal(this.route.snapshot.queryParamMap.get('raison') === 'expiree');
  protected formulaire = this.fb.group({ email: ['', [Validators.required, Validators.email]], motDePasse: ['', [Validators.required]] });

  protected soumettre(): void {
    if (this.formulaire.invalid || this.envoi() || !this.reseau.enLigne()) { this.formulaire.markAllAsTouched(); return; }
    this.envoi.set(true); this.erreur.set(null);
    this.auth.connecter(this.formulaire.getRawValue()).subscribe({
      next: () => { this.envoi.set(false); this.router.navigateByUrl(retourSecurise(this.route.snapshot.queryParamMap.get('retour'), this.auth.espaceParDefaut())); },
      error: err => { this.erreur.set(messageErreur(err)); this.envoi.set(false); },
    });
  }

  protected erreurChamp(nom: 'email' | 'motDePasse'): string | null {
    const champ = this.formulaire.controls[nom];
    if (!champ.touched || !champ.invalid) return null;
    return nom === 'email' ? 'Saisissez une adresse e-mail valide.' : 'Saisissez votre mot de passe.';
  }
}

export function retourSecurise(retour: string | null, defaut: string): string {
  if (!retour?.startsWith('/') || retour.startsWith('//')) return defaut;
  // Les pages d'auth ne sont jamais une destination : naviguer vers l'URL
  // courante est un no-op Angular qui laisse le bouton en chargement infini.
  const page = retour.split('?', 1)[0];
  if (page === '/connexion' || page === '/inscription') return defaut;
  return retour;
}
