import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Commande } from '../../shared/models/api';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { CommandeService } from './commande.service';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, FcfaPipe, ButtonDirective, EmptyStateComponent, ErrorStateComponent, SkeletonComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="commandes container"><div class="titre"><p class="eyebrow">Mon compte</p><h1>Mes commandes</h1></div>
      @if (chargement()) { <div class="squelette"><app-skeleton [lignes]="7" /></div> }
      @else if (erreur()) { <app-error-state type="reseau" titre="Vos commandes sont indisponibles" [reessayable]="true" (reessayer)="charger()" /> }
      @else if (!commandes().length) { <app-empty-state message="Vous n'avez pas encore passé de commande."><a routerLink="/" appButton="secondary">Voir le catalogue</a></app-empty-state> }
      @else { <div class="liste">@for (commande of commandes(); track commande.id) { <article class="commande"><div><a [routerLink]="['/commandes', commande.id]">Commande n°{{ commande.id }}</a><span>Créée le {{ commande.dateCreation | date:'d MMMM y à HH:mm':'':'fr' }}</span></div><app-status-badge [code]="commande.statut" /><strong>{{ commande.total | fcfa }}</strong><a [routerLink]="['/commandes', commande.id]" class="voir">Voir le suivi</a></article> }</div> }
    </section>`,
  styles: `.commandes { padding-block:var(--space-6); } .titre { margin-bottom:var(--space-5); } .eyebrow { margin:0; color:var(--color-primary); font-weight:600; } .liste { border-top:1px solid var(--color-border); } .commande { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:var(--space-3); align-items:center; padding:var(--space-4) 0; border-bottom:1px solid var(--color-border); } .commande > div { display:grid; gap:var(--space-1); } .commande > div > a { color:var(--color-text); font-weight:600; text-decoration:none; } .commande span { color:var(--color-text-muted); font-size:14px; } .voir { grid-column:1 / -1; color:var(--color-primary); font-weight:600; } .squelette { max-width:600px; padding:var(--space-5); background:var(--color-surface); } @media (min-width:768px) { .commande { grid-template-columns:minmax(0,1fr) auto 140px auto; gap:var(--space-5); } .voir { grid-column:auto; } .commande > strong { text-align:right; } }`,
})
export class MesCommandesPageComponent {
  private commandeService = inject(CommandeService);
  protected commandes = signal<Commande[]>([]);
  protected chargement = signal(true);
  protected erreur = signal(false);
  constructor() { this.charger(); }
  protected charger(): void { this.chargement.set(true); this.erreur.set(false); this.commandeService.mesCommandes().subscribe({ next: commandes => { this.commandes.set(commandes); this.chargement.set(false); }, error: () => { this.erreur.set(true); this.chargement.set(false); } }); }
}
