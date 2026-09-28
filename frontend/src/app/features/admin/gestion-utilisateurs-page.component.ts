import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UtilisateurAdmin } from '../../shared/models/api';
import { GestionService } from './gestion.service';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  standalone: true,
  imports: [AlertComponent, ButtonDirective, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="gestion-page"><div><p class="eyebrow">Gestion</p><h1>Utilisateurs</h1></div>@if (message()) { <app-alert [tone]="messageTone()">{{ message() }}</app-alert> }<div class="liste">@for (utilisateur of utilisateurs(); track utilisateur.id) { <article class="ligne"><div><strong>{{ utilisateur.prenom }} {{ utilisateur.nom }}</strong><span>{{ utilisateur.email }} · {{ utilisateur.roles.join(', ') }}</span></div>@if (utilisateur.verrouille) { <div class="actions"><app-status-badge code="VERROUILLE" /><button type="button" appButton="secondary" (click)="debloquer(utilisateur)">Débloquer</button></div> } @else { <span class="actif">Actif</span> }</article> } @empty { <p>Aucun utilisateur.</p> }</div></section>` ,
  styles: `.gestion-page { display:grid; gap:var(--space-5); } .eyebrow { color:var(--color-primary); font-weight:600; } .liste { border-top:1px solid var(--color-border); } .ligne { display:flex; justify-content:space-between; align-items:center; gap:var(--space-3); padding:var(--space-4) 0; border-bottom:1px solid var(--color-border); } .ligne div:first-child { display:grid; gap:var(--space-1); } .ligne span { color:var(--color-text-muted); font-size:14px; } .actions { display:flex; align-items:center; gap:var(--space-2); } .actif { color:var(--color-success); font-weight:600; }`,
})
export class GestionUtilisateursPageComponent {
  private service = inject(GestionService); protected utilisateurs = signal<UtilisateurAdmin[]>([]); protected message = signal<string | null>(null); protected messageTone = signal<'success' | 'error'>('success');
  constructor() { this.charger(); }
  private charger(): void { this.service.utilisateurs().subscribe({ next: utilisateurs => this.utilisateurs.set(utilisateurs), error: () => { this.message.set('Les utilisateurs sont indisponibles.'); this.messageTone.set('error'); } }); }
  protected debloquer(utilisateur: UtilisateurAdmin): void { this.service.debloquerUtilisateur(utilisateur.id).subscribe({ next: () => { this.message.set('Compte débloqué.'); this.messageTone.set('success'); this.charger(); }, error: () => { this.message.set('Le déblocage a échoué.'); this.messageTone.set('error'); } }); }
}
