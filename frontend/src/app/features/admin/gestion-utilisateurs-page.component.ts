import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role, UtilisateurAdmin } from '../../shared/models/api';
import { AuthService } from '../../core/auth/auth.service';
import { messageErreur } from '../../core/http/erreurs';
import { GestionService } from './gestion.service';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ModalComponent } from '../../shared/ui/modal.component';
import { ControlDirective, FieldComponent } from '../../shared/ui/field.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { ToastService } from '../../shared/ui/toast';

const ROLES: Role[] = ['CLIENT', 'COLLECTEUR', 'ADMIN'];

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, AlertComponent, ButtonDirective, ModalComponent, FieldComponent, ControlDirective, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="gestion-page">
      <div class="entete"><div><p class="eyebrow">Gestion</p><h1>Utilisateurs</h1></div>
      <button type="button" appButton (click)="creationOuverte.set(true)">Nouvel utilisateur</button></div>
      @if (message()) { <app-alert tone="error">{{ message() }}</app-alert> }
      <div class="liste">
        @for (utilisateur of utilisateurs(); track utilisateur.id) {
          <article class="ligne">
            <div><strong>{{ utilisateur.prenom }} {{ utilisateur.nom }}</strong><span>{{ utilisateur.email }}@if (utilisateur.email === emailConnecte()) { · vous }</span></div>
            <div class="actions">
              @if (utilisateur.verrouille) { <app-status-badge code="VERROUILLE" /><button type="button" appButton="secondary" (click)="debloquer(utilisateur)">Débloquer</button> }
              @else { <span class="actif">Actif</span> }
              <label class="role">Rôle
                <select [value]="rolePrincipal(utilisateur)" [disabled]="utilisateur.email === emailConnecte()" (change)="changerRole(utilisateur, $event)" [attr.aria-label]="'Rôle de ' + utilisateur.email">
                  @for (role of roles; track role) { <option [value]="role">{{ role }}</option> }
                </select>
              </label>
            </div>
          </article>
        } @empty { <p>Aucun utilisateur.</p> }
      </div>
    </section>
    <app-modal titre="Nouvel utilisateur" [(open)]="creationOuverte">
      <form [formGroup]="formulaire" (ngSubmit)="creer()" novalidate>
        <app-field label="Adresse e-mail" [error]="erreurChamp('email')"><input appControl class="input" type="email" autocomplete="off" formControlName="email" /></app-field>
        <app-field label="Prénom"><input appControl class="input" type="text" autocomplete="off" formControlName="prenom" /></app-field>
        <app-field label="Nom"><input appControl class="input" type="text" autocomplete="off" formControlName="nom" /></app-field>
        <app-field label="Mot de passe (8 caractères minimum)" [error]="erreurChamp('motDePasse')"><input appControl class="input" type="password" autocomplete="new-password" formControlName="motDePasse" /></app-field>
        <app-field label="Rôle"><select appControl class="input" formControlName="role">@for (role of roles; track role) { <option [value]="role">{{ role }}</option> }</select></app-field>
        <div class="formulaire__actions"><button type="button" appButton="secondary" (click)="creationOuverte.set(false)">Annuler</button><button type="submit" appButton [loading]="envoi()">Créer le compte</button></div>
      </form>
    </app-modal>`,
  styles: `.gestion-page { display:grid; gap:var(--space-5); } .entete { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); } .eyebrow { color:var(--color-primary); font-weight:600; } .liste { border-top:1px solid var(--color-border); } .ligne { display:flex; justify-content:space-between; align-items:center; gap:var(--space-3); padding:var(--space-4) 0; border-bottom:1px solid var(--color-border); } .ligne div:first-child { display:grid; gap:var(--space-1); } .ligne span { color:var(--color-text-muted); font-size:14px; } .actions { display:flex; align-items:center; gap:var(--space-2); } .actif { color:var(--color-success); font-weight:600; } .role { display:inline-flex; align-items:center; gap:var(--space-1); font-size:14px; } .role select { min-height:44px; border:1px solid var(--color-border-strong); border-radius:var(--radius-sm); background:var(--color-surface); } form { display:grid; gap:var(--space-2); } .formulaire__actions { display:flex; justify-content:flex-end; gap:var(--space-3); margin-top:var(--space-2); }`,
})
export class GestionUtilisateursPageComponent {
  private fb = inject(FormBuilder).nonNullable;
  private service = inject(GestionService);
  private toasts = inject(ToastService);
  private auth = inject(AuthService);
  protected readonly roles = ROLES;
  protected utilisateurs = signal<UtilisateurAdmin[]>([]);
  protected message = signal<string | null>(null);
  protected creationOuverte = signal(false);
  protected envoi = signal(false);
  protected formulaire = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    prenom: [''],
    nom: [''],
    motDePasse: ['', [Validators.required, Validators.minLength(8)]],
    role: ['COLLECTEUR' as Role, Validators.required],
  });

  protected emailConnecte(): string | null { return this.auth.email(); }

  constructor() { this.charger(); }

  protected rolePrincipal(utilisateur: UtilisateurAdmin): Role { return utilisateur.roles[0] ?? 'CLIENT'; }

  protected debloquer(utilisateur: UtilisateurAdmin): void {
    this.service.debloquerUtilisateur(utilisateur.id).subscribe({
      next: () => { this.toasts.succes(`Compte ${utilisateur.email} débloqué.`); this.charger(); },
      error: err => this.toasts.erreur(messageErreur(err)),
    });
  }

  protected changerRole(utilisateur: UtilisateurAdmin, evenement: Event): void {
    const role = (evenement.target as HTMLSelectElement).value as Role;
    if (role === this.rolePrincipal(utilisateur)) return;
    // Remplace l'ensemble des rôles côté backend : l'admin choisit explicitement le rôle unique.
    this.service.remplacerRoles(utilisateur.id, [role]).subscribe({
      next: () => { this.toasts.succes(`${utilisateur.email} est désormais ${role}.`); this.charger(); },
      error: err => { this.toasts.erreur(messageErreur(err)); this.charger(); },
    });
  }

  protected creer(): void {
    if (this.formulaire.invalid || this.envoi()) { this.formulaire.markAllAsTouched(); return; }
    this.envoi.set(true);
    const value = this.formulaire.getRawValue();
    this.service.creerUtilisateur({ email: value.email, motDePasse: value.motDePasse, nom: value.nom, prenom: value.prenom, roles: [value.role] }).subscribe({
      next: utilisateur => {
        this.toasts.succes(`Compte ${utilisateur.email} créé avec le rôle ${utilisateur.roles.join(', ')}.`);
        this.envoi.set(false); this.creationOuverte.set(false);
        this.formulaire.reset({ email: '', prenom: '', nom: '', motDePasse: '', role: 'COLLECTEUR' });
        this.charger();
      },
      error: err => { this.toasts.erreur(messageErreur(err)); this.envoi.set(false); },
    });
  }

  protected erreurChamp(nom: 'email' | 'motDePasse'): string | null {
    const champ = this.formulaire.controls[nom];
    if (!champ.touched || !champ.invalid) return null;
    if (nom === 'email') return 'Saisissez une adresse e-mail valide.';
    return 'Huit caractères minimum.';
  }

  private charger(): void {
    this.service.utilisateurs().subscribe({
      next: utilisateurs => this.utilisateurs.set(utilisateurs),
      error: () => this.message.set('Les utilisateurs sont indisponibles.'),
    });
  }
}
