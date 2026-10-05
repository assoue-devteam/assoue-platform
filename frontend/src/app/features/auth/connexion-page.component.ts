import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NetworkService } from '../../core/network.service';
import { messageErreur } from '../../core/http/erreurs';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ControlDirective, FieldComponent } from '../../shared/ui/field.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

/** 423 = compte bloqué : alerte « warning » avec le contact AS'SOUÉ, pas l'erreur générique. */
export function estCompteBloque(err: unknown): boolean {
  return err instanceof HttpErrorResponse && err.status === 423;
}

/**
 * Message d'échec de connexion. Le 401 reste volontairement vague (ne révèle jamais si
 * l'email existe) ; le réseau et la 5xx reçoivent un message générique avec réessai
 * (le formulaire reste rempli, le bouton se réactive).
 */
export function messageErreurConnexion(err: unknown): string {
  if (err instanceof HttpErrorResponse && err.status === 401) return 'Email ou mot de passe incorrect.';
  if (estCompteBloque(err)) {
    return 'Votre compte est bloqué après 3 tentatives. Contactez AS\u2019SOUÉ pour le débloquer : +226 72 48 00 02 (WhatsApp 54 95 82 82).';
  }
  return messageErreur(err);
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, ButtonDirective, FieldComponent, ControlDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="auth container"><div class="auth__contenu"><h1>Se connecter</h1>
      @if (raisonExpiree()) { <app-alert tone="warning">Votre session a expiré. Connectez-vous pour continuer.</app-alert> }
      @if (erreur()) { <app-alert [tone]="bloque() ? 'warning' : 'error'">{{ erreur() }}</app-alert> }
      <form [formGroup]="formulaire" (ngSubmit)="soumettre()" novalidate>
        <app-field label="Adresse e-mail" [error]="erreurChamp('email')"><input appControl class="input" type="email" autocomplete="email" formControlName="email" /></app-field>
        <app-field label="Mot de passe" [error]="erreurChamp('motDePasse')">
          <span class="motdepasse">
            <input appControl class="input" [type]="motDePasseVisible() ? 'text' : 'password'" autocomplete="current-password" formControlName="motDePasse" />
            <button type="button" class="voir" (click)="motDePasseVisible.set(!motDePasseVisible())" [attr.aria-pressed]="motDePasseVisible()" [attr.aria-label]="motDePasseVisible() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
              <app-icon [name]="motDePasseVisible() ? 'eye-off' : 'eye'" [size]="20" />
            </button>
          </span>
        </app-field>
        <label class="souvenir"><input type="checkbox" formControlName="seSouvenir" /> Se souvenir de moi</label>
        <button type="submit" appButton [block]="true" [loading]="envoi()" [disabled]="!reseau.enLigne() || envoi()">Se connecter</button>
      </form>
      @if (!reseau.enLigne()) { <app-alert tone="warning">La connexion nécessite une connexion internet.</app-alert> }
      <p class="auth__lien">Vous n'avez pas de compte ? <a routerLink="/inscription">Créer un compte</a></p>
    </div></section>`,
  styles: `.auth { display:grid; place-items:start center; padding-block:var(--space-7); } .auth__contenu { width:min(100%,440px); display:grid; gap:var(--space-4); } h1 { font-size:28px; } form { display:grid; gap:var(--space-2); } .auth__lien { color:var(--color-text-muted); }
    .motdepasse { position:relative; display:block; } .motdepasse .input { width:100%; padding-right:52px; }
    .voir { position:absolute; right:var(--space-1); top:50%; translate:0 -50%; display:inline-grid; place-items:center; min-width:44px; min-height:44px; border:0; border-radius:var(--radius-sm); background:none; color:var(--color-text-muted); cursor:pointer; }
    .voir:hover { color:var(--color-text); } .voir:focus-visible { outline:none; box-shadow:var(--focus-ring); }
    .souvenir { display:flex; align-items:center; gap:var(--space-2); min-height:44px; cursor:pointer; } .souvenir input { width:20px; height:20px; accent-color:var(--color-primary); }`,
})
export class ConnexionPageComponent {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected reseau = inject(NetworkService);
  protected envoi = signal(false);
  protected erreur = signal<string | null>(null);
  protected bloque = signal(false);
  protected motDePasseVisible = signal(false);
  protected raisonExpiree = signal(this.route.snapshot.queryParamMap.get('raison') === 'expiree');
  protected formulaire = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required]],
    seSouvenir: [true],
  });

  protected soumettre(): void {
    if (this.formulaire.invalid || this.envoi() || !this.reseau.enLigne()) { this.formulaire.markAllAsTouched(); return; }
    this.envoi.set(true); this.erreur.set(null); this.bloque.set(false);
    const { email, motDePasse, seSouvenir } = this.formulaire.getRawValue();
    this.auth.connecter({ email, motDePasse }, seSouvenir).subscribe({
      next: () => { this.envoi.set(false); this.router.navigateByUrl(retourSecurise(this.route.snapshot.queryParamMap.get('retour'), this.auth.espaceParDefaut())); },
      error: err => { this.bloque.set(estCompteBloque(err)); this.erreur.set(messageErreurConnexion(err)); this.envoi.set(false); },
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
