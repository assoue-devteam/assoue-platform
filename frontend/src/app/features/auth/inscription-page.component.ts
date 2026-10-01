import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NetworkService } from '../../core/network.service';
import { messageErreur } from '../../core/http/erreurs';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ControlDirective, FieldComponent } from '../../shared/ui/field.component';
import { retourSecurise } from './connexion-page.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, ButtonDirective, FieldComponent, ControlDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="auth container"><div class="auth__contenu"><p class="eyebrow">AS'SOUÉ</p><h1>Créer un compte</h1>
      @if (erreur()) { <app-alert tone="error">{{ erreur() }}</app-alert> }
      <form [formGroup]="formulaire" (ngSubmit)="soumettre()" novalidate>
        <div class="noms"><app-field label="Prénom" [error]="erreurChamp('prenom')"><input appControl class="input" autocomplete="given-name" formControlName="prenom" /></app-field><app-field label="Nom" [error]="erreurChamp('nom')"><input appControl class="input" autocomplete="family-name" formControlName="nom" /></app-field></div>
        <app-field label="Adresse e-mail" [error]="erreurChamp('email')"><input appControl class="input" type="email" autocomplete="email" formControlName="email" /></app-field>
        <app-field label="Mot de passe" hint="Au moins 8 caractères." [error]="erreurChamp('motDePasse')"><input appControl class="input" type="password" autocomplete="new-password" formControlName="motDePasse" /></app-field>
        <button type="submit" appButton [block]="true" [loading]="envoi()" [disabled]="!reseau.enLigne()">Créer mon compte</button>
      </form>
      @if (!reseau.enLigne()) { <app-alert tone="warning">La création de compte nécessite une connexion internet.</app-alert> }
      <p class="auth__lien">Vous avez déjà un compte ? <a routerLink="/connexion">Se connecter</a></p>
    </div></section>`,
  styles: `.auth { display:grid; place-items:start center; padding-block:var(--space-7); } .auth__contenu { width:min(100%,520px); display:grid; gap:var(--space-4); } .eyebrow { margin:0; color:var(--color-primary); font-weight:600; } form { display:grid; gap:var(--space-2); } .noms { display:grid; gap:var(--space-4); } .auth__lien { color:var(--color-text-muted); } @media (min-width:600px) { .noms { grid-template-columns:1fr 1fr; } }`,
})
export class InscriptionPageComponent {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected reseau = inject(NetworkService);
  protected envoi = signal(false);
  protected erreur = signal<string | null>(null);
  protected formulaire = this.fb.group({ prenom: ['', Validators.required], nom: ['', Validators.required], email: ['', [Validators.required, Validators.email]], motDePasse: ['', [Validators.required, Validators.minLength(8)]] });

  protected soumettre(): void {
    if (this.formulaire.invalid || this.envoi() || !this.reseau.enLigne()) { this.formulaire.markAllAsTouched(); return; }
    this.envoi.set(true); this.erreur.set(null);
    this.auth.inscrire(this.formulaire.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(retourSecurise(this.route.snapshot.queryParamMap.get('retour'), this.auth.espaceParDefaut())),
      error: err => { this.erreur.set(messageErreur(err)); this.envoi.set(false); },
    });
  }

  protected erreurChamp(nom: 'prenom' | 'nom' | 'email' | 'motDePasse'): string | null {
    const champ = this.formulaire.controls[nom];
    if (!champ.touched || !champ.invalid) return null;
    if (nom === 'email') return 'Saisissez une adresse e-mail valide.';
    if (nom === 'motDePasse') return 'Le mot de passe doit contenir au moins 8 caractères.';
    return 'Ce champ est obligatoire.';
  }
}
