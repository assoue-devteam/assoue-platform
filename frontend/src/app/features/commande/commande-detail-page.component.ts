import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Commande } from '../../shared/models/api';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { CommandeService } from './commande.service';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, FcfaPipe, ButtonDirective, ErrorStateComponent, SkeletonComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="detail container"><a routerLink="/commandes" class="retour">Mes commandes</a>
      @if (commande(); as item) { <div class="detail__entete"><div><p class="eyebrow">Commande n°{{ item.id }}</p><h1>Suivi de votre commande</h1><p>Créée le {{ item.dateCreation | date:'d MMMM y à HH:mm':'':'fr' }}</p></div><app-status-badge [code]="item.statut" /></div>
        @if (item.statut === 'EN_ATTENTE_PAIEMENT') { <div class="attente"><p>Votre commande est réservée. Le paiement est nécessaire pour la confirmer.</p><a [routerLink]="['/commandes', item.id, 'paiement']" appButton="purchase">Payer {{ item.total | fcfa }}</a></div> }
        @else if (item.statut === 'PAYEE') { <div class="confirmation">Votre paiement est confirmé. Nous préparons votre commande.</div> }
        <section class="recap"><h2>Articles</h2><ul>@for (ligne of item.lignes; track ligne.produitId) { <li><div><strong>{{ ligne.produitNom }}</strong><span>{{ ligne.quantite }} × {{ ligne.prixUnitaire | fcfa }}</span></div><strong>{{ ligne.quantite * ligne.prixUnitaire | fcfa }}</strong></li> }</ul><div class="total"><span>Total</span><strong>{{ item.total | fcfa }}</strong></div></section>
      } @else if (chargement()) { <div class="squelette"><app-skeleton [lignes]="6" /></div> } @else { <app-error-state type="introuvable" titre="Commande introuvable" texte="Vérifiez le lien, ou retrouvez vos commandes dans votre historique."><a routerLink="/commandes" appButton="secondary">Voir mes commandes</a></app-error-state> }
    </section>`,
  styles: `.detail { padding-block:var(--space-6); max-width:900px; } .retour { display:inline-block; margin-bottom:var(--space-5); color:var(--color-primary); font-weight:600; } .detail__entete { display:flex; justify-content:space-between; align-items:start; gap:var(--space-4); margin-bottom:var(--space-5); } .eyebrow { margin:0; color:var(--color-primary); font-weight:600; } .detail__entete p:not(.eyebrow) { color:var(--color-text-muted); } .attente,.confirmation { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:var(--space-4); padding:var(--space-4); margin-bottom:var(--space-5); border-radius:var(--radius-md); } .attente { background:var(--color-warning-bg); color:var(--color-warning); } .confirmation { background:var(--color-success-bg); color:var(--color-success); } .recap { border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); padding:var(--space-4); } .recap h2 { font:600 20px var(--font-text); } .recap ul { margin:var(--space-3) 0 0; padding:0; list-style:none; } .recap li,.total { display:flex; justify-content:space-between; gap:var(--space-4); padding:var(--space-3) 0; border-bottom:1px solid var(--color-border); } .recap li div { display:grid; gap:var(--space-1); } .recap li span { color:var(--color-text-muted); font-size:14px; } .total { border:0; align-items:baseline; } .total strong { font-size:22px; } .squelette { max-width:600px; padding:var(--space-5); background:var(--color-surface); }`,
})
export class CommandeDetailPageComponent {
  private route = inject(ActivatedRoute); private commandeService = inject(CommandeService);
  protected commande = signal<Commande | null>(null); protected chargement = signal(true);
  constructor() { this.charger(); }
  protected charger(): void { const id = Number(this.route.snapshot.paramMap.get('id')); if (!Number.isSafeInteger(id) || id <= 0) { this.chargement.set(false); return; } this.commandeService.consulter(id).subscribe({ next: commande => { this.commande.set(commande); this.chargement.set(false); }, error: () => this.chargement.set(false) }); }
}
