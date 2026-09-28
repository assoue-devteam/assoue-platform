import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Collecte } from '../../shared/models/api';
import { CollecteService } from './collecte.service';
import { NetworkService } from '../../core/network.service';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, AlertComponent, ButtonDirective, EmptyStateComponent, ErrorStateComponent, SkeletonComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="collectes">
      <div class="entete"><div><p class="eyebrow">Espace terrain</p><h1>Mes collectes</h1></div><a routerLink="/collecte/nouvelle" appButton="purchase">Déclarer</a></div>
      @if (!reseau.enLigne()) { <app-alert tone="warning">Hors ligne : les nouvelles déclarations seront envoyées au retour du réseau.</app-alert> }
      @if (service.enAttente()) { <app-alert tone="info">{{ service.enAttente() }} déclaration(s) en attente de synchronisation. <button type="button" class="texte" (click)="synchroniser()">Synchroniser</button></app-alert> }
      @if (chargement()) { <app-skeleton [lignes]="6" /> }
      @else if (erreur()) { <app-error-state type="reseau" [reessayable]="true" (reessayer)="charger()" /> }
      @else if (!collectes().length) { <app-empty-state message="Aucune collecte enregistrée."><a routerLink="/collecte/nouvelle" appButton="secondary">Faire une déclaration</a></app-empty-state> }
      @else { <div class="liste">@for (collecte of collectes(); track collecte.id || collecte.referenceClient) { <article class="ligne"><div><strong>{{ collecte.lignes[0].materiau }}</strong><span>{{ collecte.lignes[0].quantiteEstimee }} · {{ collecte.dateDeclaration | date:'d MMM y à HH:mm':'':'fr' }}</span></div><app-status-badge [code]="collecte.statut" /> @if (collecte.statut === 'DECLAREE' && collecte.id) { <a [routerLink]="['/collecte', collecte.id, 'modifier']">Modifier</a> }</article> }</div> }
    </section>` ,
  styles: `.collectes { display:grid; gap:var(--space-4); } .entete { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); } .eyebrow { color:var(--color-primary); font-weight:600; } .liste { display:grid; border-top:1px solid var(--color-border); } .ligne { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:var(--space-2); align-items:center; padding:var(--space-4) 0; border-bottom:1px solid var(--color-border); } .ligne div { display:grid; gap:var(--space-1); } .ligne span { color:var(--color-text-muted); font-size:14px; } .ligne a { grid-column:1/-1; font-weight:600; } .texte { border:0; padding:0; background:none; color:inherit; text-decoration:underline; cursor:pointer; font:inherit; }`,
})
export class MesCollectesPageComponent {
  protected service = inject(CollecteService);
  protected reseau = inject(NetworkService);
  protected collectes = signal<Collecte[]>([]);
  protected chargement = signal(true);
  protected erreur = signal(false);

  constructor() { this.charger(); }

  protected charger(): void {
    this.chargement.set(true); this.erreur.set(false);
    this.service.mesCollectes().subscribe({ next: collectes => { this.collectes.set(collectes); this.chargement.set(false); }, error: () => { this.erreur.set(true); this.chargement.set(false); } });
  }

  protected synchroniser(): void { this.service.synchroniser().subscribe({ complete: () => this.charger() }); }
}
