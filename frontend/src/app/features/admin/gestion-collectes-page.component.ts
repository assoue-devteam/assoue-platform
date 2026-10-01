import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CollecteAdmin, CollecteStatut, VolumeCollecte } from '../../shared/models/api';
import { GestionService } from './gestion.service';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { SkeletonComponent } from '../../shared/ui/states';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  standalone: true,
  imports: [DatePipe, AlertComponent, ButtonDirective, SkeletonComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="gestion-page"><div class="entete"><div><p class="eyebrow">Gestion</p><h1>Collectes</h1></div><button type="button" appButton="secondary" (click)="charger()">Actualiser</button></div>
      @if (erreur()) { <app-alert tone="error">{{ erreur() }}</app-alert> }
      <div class="filtres"><button type="button" [class.actif]="!filtre()" (click)="filtre.set(undefined); charger()">Toutes</button>@for (statut of statuts; track statut) { <button type="button" [class.actif]="filtre() === statut" (click)="filtre.set(statut); charger()">{{ statut }}</button> }</div>
      @if (chargement()) { <app-skeleton [lignes]="8" /> } @else { <div class="tableau">@for (collecte of collectes(); track collecte.id) { <article class="ligne"><div><strong>#{{ collecte.id }} · {{ collecte.collecteurEmail }}</strong><span>{{ collecte.lignes[0].materiau }} · {{ collecte.lignes[0].quantiteEstimee }} · {{ collecte.dateDeclaration | date:'d MMM y à HH:mm':'':'fr' }}</span></div><app-status-badge [code]="collecte.statut" /><div class="actions">@if (collecte.statut === 'DECLAREE') { <button type="button" appButton="secondary" (click)="valider(collecte)">Valider</button> } @if (collecte.statut === 'VALIDEE') { <button type="button" appButton="purchase" (click)="traiter(collecte)">Traiter</button> }</div></article> } @empty { <p class="vide">Aucune collecte pour ce filtre.</p> }</div> }
      <section class="volumes"><h2>Volumes cumulés</h2>@for (volume of volumes(); track volume.collecteurId + volume.materiau) { <div class="volume"><span>{{ volume.collecteurEmail }} · {{ volume.materiau }}</span><strong>{{ volume.quantiteTotale }} · {{ volume.nombreDeclarations }} déclaration(s)</strong></div> } @empty { <p class="vide">Aucun volume disponible.</p> }</section>
    </section>` ,
  styles: `.gestion-page { display:grid; gap:var(--space-5); } .entete { display:flex; justify-content:space-between; align-items:center; gap:var(--space-3); } .eyebrow { color:var(--color-primary); font-weight:600; } .filtres { display:flex; flex-wrap:wrap; gap:var(--space-2); } .filtres button { border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text); padding:8px 12px; cursor:pointer; } .filtres button.actif { background:var(--color-primary-strong); color:white; } .tableau { display:grid; border-top:1px solid var(--color-border); } .ligne,.volume { display:grid; gap:var(--space-2); padding:var(--space-4) 0; border-bottom:1px solid var(--color-border); } .ligne > div:first-child { display:grid; gap:var(--space-1); } .ligne span,.vide { color:var(--color-text-muted); } .actions { display:flex; gap:var(--space-2); } .volumes { display:grid; gap:var(--space-2); } .volume { grid-template-columns:1fr auto; }`,
})
export class GestionCollectesPageComponent {
  private service = inject(GestionService);
  protected collectes = signal<CollecteAdmin[]>([]);
  protected volumes = signal<VolumeCollecte[]>([]);
  protected chargement = signal(true);
  protected erreur = signal<string | null>(null);
  protected filtre = signal<CollecteStatut | undefined>(undefined);
  protected statuts: CollecteStatut[] = ['DECLAREE', 'VALIDEE', 'TRAITEE'];
  constructor() { this.charger(); }
  protected charger(): void { this.chargement.set(true); this.service.collectes(this.filtre()).subscribe({ next: collectes => { this.collectes.set(collectes); this.erreur.set(null); this.chargement.set(false); }, error: () => { this.erreur.set('Les collectes sont indisponibles.'); this.chargement.set(false); } }); this.service.volumes().subscribe({ next: volumes => this.volumes.set(volumes) }); }
  protected valider(collecte: CollecteAdmin): void { this.service.validerCollecte(collecte.id).subscribe({ next: () => this.charger(), error: () => this.erreur.set('La validation a échoué.') }); }
  protected traiter(collecte: CollecteAdmin): void { this.service.traiterCollecte(collecte.id).subscribe({ next: () => this.charger(), error: () => this.erreur.set('Le traitement a échoué.') }); }
}
