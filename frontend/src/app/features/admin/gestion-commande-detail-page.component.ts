import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Commande } from '../../shared/models/api';
import { CommandeService } from '../commande/commande.service';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, FcfaPipe, ButtonDirective, ErrorStateComponent, SkeletonComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="detail"><a routerLink="/gestion/commandes" class="retour">Commandes</a>@if (commande(); as item) { <div class="entete"><div><p class="eyebrow">Commande n°{{ item.id }}</p><h1>Détail de commande</h1><p>Créée le {{ item.dateCreation | date:'d MMMM y à HH:mm':'':'fr' }}</p></div><app-status-badge [code]="item.statut" /></div><section class="recap"><h2>Articles</h2>@for (ligne of item.lignes; track ligne.produitId) { <div class="ligne"><span>{{ ligne.produitNom }} · {{ ligne.quantite }} × {{ ligne.prixUnitaire | fcfa }}</span><strong>{{ ligne.quantite * ligne.prixUnitaire | fcfa }}</strong></div> }<div class="total"><span>Total</span><strong>{{ item.total | fcfa }}</strong></div></section> } @else if (chargement()) { <app-skeleton [lignes]="6" /> } @else { <app-error-state type="introuvable" titre="Commande introuvable"><a routerLink="/gestion/commandes" appButton="secondary">Retour aux commandes</a></app-error-state> }</section>` ,
  styles: `.detail { display:grid; gap:var(--space-5); max-width:900px; } .retour { font-weight:600; } .entete { display:flex; justify-content:space-between; gap:var(--space-4); } .eyebrow { color:var(--color-primary); font-weight:600; } .entete p:not(.eyebrow) { color:var(--color-text-muted); } .recap { padding:var(--space-4); border:1px solid var(--color-border); background:var(--color-surface); } .ligne,.total { display:flex; justify-content:space-between; gap:var(--space-3); padding:var(--space-3) 0; border-bottom:1px solid var(--color-border); } .total { border:0; font-size:18px; }`,
})
export class GestionCommandeDetailPageComponent {
  private route = inject(ActivatedRoute); private service = inject(CommandeService);
  protected commande = signal<Commande | null>(null); protected chargement = signal(true);
  constructor() { const id = Number(this.route.snapshot.paramMap.get('id')); if (!Number.isSafeInteger(id) || id <= 0) { this.chargement.set(false); return; } this.service.consulter(id).subscribe({ next: commande => { this.commande.set(commande); this.chargement.set(false); }, error: () => this.chargement.set(false) }); }
}
