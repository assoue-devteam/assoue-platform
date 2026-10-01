import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommandeAdmin, CommandeEnAttente } from '../../shared/models/api';
import { GestionService } from './gestion.service';
import { AlertComponent } from '../../shared/ui/alert.component';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { SkeletonComponent } from '../../shared/ui/states';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, AlertComponent, FcfaPipe, SkeletonComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="gestion-page"><div><p class="eyebrow">Gestion</p><h1>Commandes</h1></div>@if (erreur()) { <app-alert tone="error">{{ erreur() }}</app-alert> }<section class="attentes"><h2>En attente depuis 24 h</h2>@for (commande of attentes(); track commande.id) { <div class="attente"><span>Commande n°{{ commande.id }} · {{ commande.clientEmail }}</span><strong>{{ commande.heuresDAttente }} h · {{ commande.total | fcfa }}</strong></div> } @empty { <p>Aucune commande à relancer.</p> }</section>@if (chargement()) { <app-skeleton [lignes]="7" /> } @else { <div class="liste">@for (commande of commandes(); track commande.id) { <article class="ligne"><div><a [routerLink]="['/gestion/commandes', commande.id]">Commande n°{{ commande.id }}</a><span>{{ commande.clientEmail }} · {{ commande.dateCreation | date:'d MMM y à HH:mm':'':'fr' }}</span></div><app-status-badge [code]="commande.statut" /><strong>{{ commande.total | fcfa }}</strong></article> } @empty { <p>Aucune commande.</p> }</div> }</section>` ,
  styles: `.gestion-page { display:grid; gap:var(--space-5); } .eyebrow { color:var(--color-primary); font-weight:600; } .attentes { padding:var(--space-4); background:var(--color-warning-bg); } .attentes h2 { margin-bottom:var(--space-2); } .attente,.ligne { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:var(--space-3); padding:var(--space-3) 0; border-bottom:1px solid var(--color-border); } .attente:last-child { border:0; } .liste { display:grid; border-top:1px solid var(--color-border); } .ligne > div { display:grid; gap:var(--space-1); } .ligne a { font-weight:600; color:var(--color-text); text-decoration:none; } .ligne span { color:var(--color-text-muted); font-size:14px; }`,
})
export class GestionCommandesPageComponent {
  private service = inject(GestionService);
  protected commandes = signal<CommandeAdmin[]>([]); protected attentes = signal<CommandeEnAttente[]>([]); protected chargement = signal(true); protected erreur = signal<string | null>(null);
  constructor() { this.charger(); }
  protected charger(): void { this.service.commandes().subscribe({ next: commandes => { this.commandes.set(commandes); this.chargement.set(false); }, error: () => { this.erreur.set('Les commandes sont indisponibles.'); this.chargement.set(false); } }); this.service.commandesEnAttente().subscribe({ next: attentes => this.attentes.set(attentes) }); }
}
