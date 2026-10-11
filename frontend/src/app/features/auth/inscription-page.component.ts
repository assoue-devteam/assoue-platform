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
import { retourSecurise } from './connexion-page.component';

/**
 * Rattache un message d'erreur serveur 400 au bon champ quand c'est possible.
 * Le backend (GAP-11) renvoie un message global sans nom de champ : on s'appuie sur des
 * mots-clés stables (« email », « mot de passe », « 8 caractères »). Tout le reste remonte
 * en alerte haute de formulaire. Le 409 (email déjà utilisé) va toujours sur le champ email.
 */
export function champErreurInscription(statut: number, message: string): 'email' | 'motDePasse' | null {
  if (statut === 409) return 'email';
  if (statut !== 400) return null;
  const texte = message.toLowerCase();
  if (texte.includes('mot de passe') || texte.includes('8 caract')) return 'motDePasse';
  if (texte.includes('mail')) return 'email';
  return null;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, ButtonDirective, FieldComponent, ControlDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="auth container"><div class="auth__contenu"><h1>Créer un compte</h1>
      @if (erreur()) { <app-alert tone="error">{{ erreur() }} @if (emailExistant()) { <a routerLink="/connexion">Se connecter</a> }</app-alert> }
      <form [formGroup]="formulaire" (ngSubmit)="soumettre()" novalidate>
        <div class="noms"><app-field label="Prénom" [error]="erreurChamp('prenom')"><input appControl class="input" autocomplete="given-name" formControlName="prenom" /></app-field><app-field label="Nom" [error]="erreurChamp('nom')"><input appControl class="input" autocomplete="family-name" formControlName="nom" /></app-field></div>
        <app-field label="Adresse e-mail" [error]="erreurChamp('email')"><input appControl class="input" type="email" autocomplete="email" formControlName="email" /></app-field>
        <app-field label="Mot de passe" hint="Au moins 8 caractères." [error]="erreurChamp('motDePasse')">
          <span class="motdepasse">
            <input appControl class="input" [type]="motDePasseVisible() ? 'text' : 'password'" autocomplete="new-password" formControlName="motDePasse" />
            <button type="button" class="voir" (click)="motDePasseVisible.set(!motDePasseVisible())" [attr.aria-pressed]="motDePasseVisible()" [attr.aria-label]="motDePasseVisible() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
              <app-icon [name]="motDePasseVisible() ? 'eye-off' : 'eye'" [size]="20" />
            </button>
          </span>
        </app-field>
        <label class="souvenir"><input type="checkbox" formControlName="seSouvenir" /> Se souvenir de moi</label>
        <button type="submit" appButton [block]="true" [loading]="envoi()" [disabled]="!reseau.enLigne() || envoi()">Créer mon compte</button>
      </form>
      @if (!reseau.enLigne()) { <app-alert tone="warning">La création de compte nécessite une connexion internet.</app-alert> }
      <p class="auth__lien">Vous avez déjà un compte ? <a routerLink="/connexion">Se connecter</a></p>
    </div></section>`,
  styles: `.auth { display:grid; place-items:start center; padding-block:var(--space-7); } .auth__contenu { width:min(100%,440px); display:grid; gap:var(--space-4); } h1 { font-size:28px; } form { display:grid; gap:var(--space-2); } .noms { display:grid; gap:var(--space-4); } .auth__lien { color:var(--color-text-muted); } @media (min-width:600px) { .noms { grid-template-columns:1fr 1fr; } }
    .motdepasse { position:relative; display:block; } .motdepasse .input { width:100%; padding-right:52px; }
    .voir { position:absolute; right:var(--space-1); top:50%; translate:0 -50%; display:inline-grid; place-items:center; min-width:44px; min-height:44px; border:0; border-radius:var(--radius-sm); background:none; color:var(--color-text-muted); cursor:pointer; }
    .voir:hover { color:var(--color-text); } .voir:focus-visible { outline:none; box-shadow:var(--focus-ring); }
    .souvenir { display:flex; align-items:center; gap:var(--space-2); min-height:44px; cursor:pointer; } .souvenir input { width:20px; height:20px; accent-color:var(--color-primary); }`,
})
export class InscriptionPageComponent {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected reseau = inject(NetworkService);
  protected envoi = signal(false);
  protected erreur = signal<string | null>(null);
  protected emailExistant = signal(false);
  protected motDePasseVisible = signal(false);
  // Erreur renvoyée par le serveur et rattachée à un champ (GAP-11 : rattachement par mots-clés).
  private erreurServeur = signal<{ champ: 'email' | 'motDePasse'; message: string } | null>(null);
  protected formulaire = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required, Validators.minLength(8)]],
    seSouvenir: [true],
  });

  protected soumettre(): void {
    if (this.formulaire.invalid || this.envoi() || !this.reseau.enLigne()) { this.formulaire.markAllAsTouched(); return; }
    this.envoi.set(true); this.erreur.set(null); this.emailExistant.set(false); this.erreurServeur.set(null);
    const { prenom, nom, email, motDePasse, seSouvenir } = this.formulaire.getRawValue();
    this.auth.inscrire({ prenom, nom, email, motDePasse }, seSouvenir).subscribe({
      next: () => this.router.navigateByUrl(retourSecurise(this.route.snapshot.queryParamMap.get('retour'), this.auth.espaceParDefaut())),
      error: err => {
        const statut = err instanceof HttpErrorResponse ? err.status : 0;
        const messageServeur = err instanceof HttpErrorResponse && typeof err.error?.message === 'string' ? err.error.message : '';
        const champ = champErreurInscription(statut, messageServeur);
        if (statut === 409) {
          this.emailExistant.set(true);
          this.erreurServeur.set({ champ: 'email', message: 'Un compte existe déjà avec cet email.' });
          this.erreur.set('Un compte existe déjà avec cet email.');
        } else if (champ) {
          this.erreurServeur.set({ champ, message: messageServeur || messageErreur(err) });
          this.formulaire.controls[champ].markAsTouched();
          this.erreur.set(null);
        } else {
          this.erreur.set(messageErreur(err));
        }
        this.envoi.set(false);
      },
    });
  }

  protected erreurChamp(nom: 'prenom' | 'nom' | 'email' | 'motDePasse'): string | null {
    const rattachee = this.erreurServeur();
    if (rattachee?.champ === nom) return rattachee.message;
    const champ = this.formulaire.controls[nom];
    if (!champ.touched || !champ.invalid) return null;
    if (nom === 'email') return 'Saisissez une adresse e-mail valide.';
    if (nom === 'motDePasse') return 'Le mot de passe doit contenir au moins 8 caractères.';
    return 'Ce champ est obligatoire.';
  }
}
