import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MotDePasseOublieService } from './mot-de-passe-oublie.service';
import { FieldComponent } from '../../shared/ui/field.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-mot-de-passe-oublie-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FieldComponent, IconComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <app-icon name="lock" [size]="24" />
          <h1>Mot de passe oublié</h1>
        </div>

        @if (etape() === 'demande') {
          <form [formGroup]="formDemande" (ngSubmit)="envoyerCode()">
            <app-field label="Adresse e-mail" [error]="erreurChamp(formDemande, 'email')">
              <input appControl type="email" formControlName="email" autocomplete="email" inputmode="email" />
            </app-field>
            @if (messageInfo()) {
              <p class="info-message">{{ messageInfo() }}</p>
            }
            @if (messageErreur()) {
              <p class="error-message">{{ messageErreur() }}</p>
            }
            <button type="submit" class="btn btn-primary" [disabled]="envoiEnCours() || formDemande.invalid">
              {{ envoiEnCours() ? 'Envoi…' : 'Envoyer le code' }}
            </button>
          </form>
        }

        @if (etape() === 'code') {
          <form [formGroup]="formCode" (ngSubmit)="verifierCode()">
            <p class="instructions">Entrez le code à 6 chiffres reçu par e-mail.</p>
            <app-field label="Code" [error]="erreurChamp(formCode, 'code')">
              <input appControl type="text" formControlName="code" inputmode="numeric" autocomplete="one-time-code"
                     maxlength="6" (input)="onCodeInput($event)" />
            </app-field>
            @if (messageErreur()) {
              <p class="error-message">{{ messageErreur() }}</p>
            }
            <button type="submit" class="btn btn-primary" [disabled]="envoiEnCours() || formCode.invalid">
              {{ envoiEnCours() ? 'Vérification…' : 'Vérifier le code' }}
            </button>
            <button type="button" class="btn btn-link" (click)="renvoyerCode()" [disabled]="compteARebour() > 0">
              {{ compteARebour() > 0 ? 'Renvoyer dans ' + compteARebour() + 's' : 'Renvoyer le code' }}
            </button>
          </form>
        }

        @if (etape() === 'nouveau') {
          <form [formGroup]="formNouveau" (ngSubmit)="reinitialiser()">
            <app-field label="Nouveau mot de passe" [error]="erreurChamp(formNouveau, 'nouveauMotDePasse')">
              <input appControl type="password" formControlName="nouveauMotDePasse" autocomplete="new-password" />
            </app-field>
            <p class="hint">Au moins 8 caractères.</p>
            @if (messageErreur()) {
              <p class="error-message">{{ messageErreur() }}</p>
            }
            <button type="submit" class="btn btn-primary" [disabled]="envoiEnCours() || formNouveau.invalid">
              {{ envoiEnCours() ? 'Modification…' : 'Modifier le mot de passe' }}
            </button>
          </form>
        }

        @if (etape() === 'termine') {
          <div class="success-block">
            <app-icon name="check" [size]="24" />
            <p>Votre mot de passe a été modifié avec succès.</p>
            <a routerLink="/connexion" class="btn btn-primary">Se connecter</a>
          </div>
        }

        <a routerLink="/connexion" class="back-link">← Retour à la connexion</a>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; justify-content: center; padding: 2rem 1rem; }
    .auth-card { width: 100%; max-width: 400px; background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .auth-header { text-align: center; margin-bottom: 1.5rem; }
    .auth-header h1 { font-size: 1.25rem; margin: .5rem 0 0; }
    .info-message { background: #ecfdf5; color: #065f46; padding: .75rem; border-radius: 8px; font-size: .875rem; }
    .error-message { background: #fef2f2; color: #991b1b; padding: .75rem; border-radius: 8px; font-size: .875rem; }
    .hint { font-size: .8rem; color: #6b7280; margin: -.25rem 0 .75rem; }
    .instructions { font-size: .9rem; color: #374151; margin-bottom: 1rem; }
    .btn { width: 100%; padding: .75rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; margin-top: .5rem; }
    .btn-primary { background: #15803d; color: #fff; }
    .btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
    .btn-link { background: none; color: #15803d; font-weight: 400; }
    .success-block { text-align: center; }
    .success-block p { margin: 1rem 0; }
    .back-link { display: block; text-align: center; margin-top: 1rem; color: #6b7280; text-decoration: none; font-size: .875rem; }
    input { width: 100%; padding: .625rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
  `]
})
export class MotDePasseOubliePageComponent {
  private fb = inject(FormBuilder);
  private service = inject(MotDePasseOublieService);

  etape = signal<'demande' | 'code' | 'nouveau' | 'termine'>('demande');
  envoiEnCours = signal(false);
  messageInfo = signal('');
  messageErreur = signal('');
  compteARebour = signal(0);
  private email = '';
  private jeton = '';
  private intervalId: ReturnType<typeof setInterval> | null = null;

  formDemande = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  formCode = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  formNouveau = this.fb.nonNullable.group({
    nouveauMotDePasse: ['', [Validators.required, Validators.minLength(8)]]
  });

  envoyerCode() {
    if (this.formDemande.invalid || this.envoiEnCours()) return;
    this.formDemande.markAllAsTouched();
    this.envoiEnCours.set(true);
    this.messageErreur.set('');
    this.service.demanderCode(this.formDemande.controls.email.value).subscribe({
      next: (res) => {
        this.envoiEnCours.set(false);
        this.messageInfo.set(res.message);
        this.email = this.formDemande.controls.email.value;
        setTimeout(() => {
          this.etape.set('code');
          this.demarrerCompteARebour();
        }, 1500);
      },
      error: (err) => {
        this.envoiEnCours.set(false);
        this.messageErreur.set(err.error?.message || 'Une erreur est survenue.');
      }
    });
  }

  verifierCode() {
    if (this.formCode.invalid || this.envoiEnCours()) return;
    this.formCode.markAllAsTouched();
    this.envoiEnCours.set(true);
    this.messageErreur.set('');
    this.service.verifierCode(this.email, this.formCode.controls.code.value).subscribe({
      next: (res) => {
        this.envoiEnCours.set(false);
        this.jeton = res.jeton;
        this.etape.set('nouveau');
      },
      error: (err) => {
        this.envoiEnCours.set(false);
        this.messageErreur.set(err.error?.message || 'Code invalide ou expiré.');
      }
    });
  }

  reinitialiser() {
    if (this.formNouveau.invalid || this.envoiEnCours()) return;
    this.formNouveau.markAllAsTouched();
    this.envoiEnCours.set(true);
    this.messageErreur.set('');
    this.service.reinitialiser(this.jeton, this.formNouveau.controls.nouveauMotDePasse.value).subscribe({
      next: () => {
        this.envoiEnCours.set(false);
        this.etape.set('termine');
      },
      error: (err) => {
        this.envoiEnCours.set(false);
        this.messageErreur.set(err.error?.message || 'Une erreur est survenue.');
      }
    });
  }

  renvoyerCode() {
    this.envoiEnCours.set(true);
    this.messageErreur.set('');
    this.service.demanderCode(this.email).subscribe({
      next: () => {
        this.envoiEnCours.set(false);
        this.demarrerCompteARebour();
      },
      error: (err) => {
        this.envoiEnCours.set(false);
        this.messageErreur.set(err.error?.message || 'Une erreur est survenue.');
      }
    });
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 6);
    this.formCode.controls.code.setValue(input.value);
  }

  demarrerCompteARebour() {
    this.compteARebour.set(30);
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.compteARebour.update(v => {
        if (v <= 1 && this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  erreurChamp(form: { controls: Record<string, AbstractControl> }, nom: string): string {
    const champ = form.controls[nom];
    if (!champ || !champ.touched || !champ.invalid) return '';
    if (champ.hasError('required')) return 'Ce champ est requis.';
    if (champ.hasError('email')) return 'Adresse e-mail invalide.';
    if (champ.hasError('minlength')) return 'Au moins 8 caractères.';
    if (champ.hasError('pattern')) return 'Le code doit contenir 6 chiffres.';
    return '';
  }
}
