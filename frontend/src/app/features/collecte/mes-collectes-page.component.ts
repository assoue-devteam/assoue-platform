import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Collecte } from '../../shared/models/api';
import { CollecteService } from './collecte.service';
import { NetworkService } from '../../core/network.service';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, AlertComponent, ButtonDirective, EmptyStateComponent, ErrorStateComponent, SkeletonComponent, StatusBadgeComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="collectes">
      <div><p class="eyebrow">Espace terrain</p><h1>Mes collectes</h1></div>
      <a routerLink="/collecte/nouvelle" class="declarer"><app-icon name="plus" [size]="24" /><span><strong>Déclarer une collecte</strong><span>Matériau, quantité et position</span></span></a>
      @if (!reseau.enLigne()) { <app-alert tone="warning">Hors ligne : les nouvelles déclarations seront envoyées au retour du réseau.</app-alert> }
      @if (service.enAttente()) { <app-alert tone="info">{{ service.enAttente() }} déclaration(s) en attente de synchronisation. <button type="button" class="texte" (click)="synchroniser()">Synchroniser</button></app-alert> }
      @if (chargement()) { <app-skeleton [lignes]="6" /> }
      @else if (erreur()) { <app-error-state type="reseau" [reessayable]="true" (reessayer)="charger()" /> }
      @else if (!collectes().length) { <app-empty-state message="Aucune collecte enregistrée."><a routerLink="/collecte/nouvelle" appButton="secondary">Faire une déclaration</a></app-empty-state> }
      @else {
        <div class="compteurs" aria-label="Résumé de mes collectes">
          <div><strong class="num">{{ resume().declarees }}</strong><span>déclarées</span></div>
          <div><strong class="num">{{ resume().validees }}</strong><span>validées</span></div>
          <div><strong class="num">{{ resume().aValider }}</strong><span>en attente de validation</span></div>
        </div>
        <h2>Collectes récentes</h2>
        <div class="liste">@for (collecte of collectes(); track collecte.id || collecte.referenceClient) { <article class="ligne"><div><strong>{{ collecte.lignes[0].materiau }}</strong><span>{{ collecte.lignes[0].quantiteEstimee }} · {{ collecte.dateDeclaration | date:'d MMM y à HH:mm':'':'fr' }}</span></div><app-status-badge [code]="collecte.statut" /> @if (collecte.statut === 'DECLAREE' && collecte.id) { <a [routerLink]="['/collecte', collecte.id, 'modifier']">Modifier</a> }</article> }</div> }
    </section>` ,
  styles: `.collectes { display:grid; gap:var(--space-4); }
    .declarer { display:flex; align-items:center; gap:var(--space-4); min-height:72px; padding:var(--space-4) var(--space-5); border-radius:var(--radius-md); background:var(--color-primary); color:var(--color-text-on-dark); text-decoration:none; }
    .declarer:hover { background:var(--color-primary-strong); }
    .declarer:focus-visible { outline:none; box-shadow:var(--focus-ring); }
    .declarer > span { display:grid; gap:2px; } .declarer strong { font-size:18px; } .declarer span span { font-size:14px; opacity:.9; }
    .compteurs { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--space-2); }
    .compteurs div { display:grid; gap:var(--space-1); justify-items:center; padding:var(--space-3) var(--space-2); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); text-align:center; }
    .compteurs strong { font-size:28px; line-height:1.1; color:var(--color-chiffre); } .compteurs span { font-size:13px; color:var(--color-text-muted); }
    h2 { margin-top:var(--space-2); } .eyebrow { color:var(--color-primary); font-weight:600; } .liste { display:grid; border-top:1px solid var(--color-border); } .ligne { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:var(--space-2); align-items:center; padding:var(--space-4) 0; border-bottom:1px solid var(--color-border); } .ligne div { display:grid; gap:var(--space-1); } .ligne span { color:var(--color-text-muted); font-size:14px; } .ligne a { grid-column:1/-1; font-weight:600; } .texte { border:0; padding:0; background:none; color:inherit; text-decoration:underline; cursor:pointer; font:inherit; }`,
})
export class MesCollectesPageComponent {
  protected service = inject(CollecteService);
  protected reseau = inject(NetworkService);
  protected collectes = signal<Collecte[]>([]);
  protected chargement = signal(true);
  protected erreur = signal(false);
  // TRAITEE suit VALIDEE : une collecte traitée a forcément été validée.
  protected resume = computed(() => {
    const collectes = this.collectes();
    return {
      declarees: collectes.length,
      validees: collectes.filter(c => c.statut === 'VALIDEE' || c.statut === 'TRAITEE').length,
      aValider: collectes.filter(c => c.statut === 'DECLAREE').length,
    };
  });

  constructor() { this.charger(); }

  protected charger(): void {
    this.chargement.set(true); this.erreur.set(false);
    this.service.mesCollectes().subscribe({ next: collectes => { this.collectes.set(collectes); this.chargement.set(false); }, error: () => { this.erreur.set(true); this.chargement.set(false); } });
  }

  protected synchroniser(): void { this.service.synchroniser().subscribe({ complete: () => this.charger() }); }
}
