import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NetworkService } from '../../core/network.service';
import { messageErreur } from '../../core/http/erreurs';
import { Commande } from '../../shared/models/api';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { CommandeService } from './commande.service';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, FcfaPipe, AlertComponent, ButtonDirective, ErrorStateComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="paiement container"><a [routerLink]="['/commandes', commandeId]" class="retour">Commande n°{{ commandeId }}</a>
      @if (commande(); as item) {
        @if (item.statut === 'PAYEE') { <app-alert tone="success">Cette commande est déjà payée. <a [routerLink]="['/commandes', item.id]">Voir le suivi</a></app-alert> }
        @else if (item.statut !== 'EN_ATTENTE_PAIEMENT') { <app-alert tone="warning">Cette commande ne peut plus être réglée dans son état actuel.</app-alert> }
        @else { <div class="paiement__titre"><h1>Payer la commande n°{{ item.id }}</h1><p>Créée le {{ item.dateCreation | date:'d MMMM y à HH:mm':'':'fr' }}</p></div>
          @if (erreur()) { <app-alert tone="error">{{ erreur() }}</app-alert> }
          <section class="recap"><ul>@for (ligne of item.lignes; track ligne.produitId) { <li><div><strong>{{ ligne.produitNom }}</strong><span>{{ ligne.quantite }} × {{ ligne.prixUnitaire | fcfa }}</span></div><strong>{{ ligne.quantite * ligne.prixUnitaire | fcfa }}</strong></li> }</ul><div class="total"><span>Total</span><strong>{{ item.total | fcfa }}</strong></div></section>
          <p class="information">Vous serez redirigé vers PayDunya pour payer avec Orange Money ou Moov Money.</p>
          @if (!reseau.enLigne()) { <app-alert tone="warning">Une connexion internet est nécessaire pour payer.</app-alert><button type="button" appButton="purchase" [block]="true" disabled>Payer {{ item.total | fcfa }}</button> }
          @else { <button type="button" appButton="purchase" [block]="true" [loading]="initiationEnCours()" (click)="payer(item)">Payer {{ item.total | fcfa }}</button> }
        }
      } @else if (chargement()) { <div class="squelette"><app-skeleton [lignes]="6" /></div> } @else { <app-error-state type="introuvable" titre="Commande introuvable" texte="Cette commande n'est pas accessible."><a routerLink="/commandes" appButton="secondary">Voir mes commandes</a></app-error-state> }
    </section>`,
  styles: `.paiement { padding-block:var(--space-6); max-width:640px; } .retour { display:inline-block; margin-bottom:var(--space-5); color:var(--color-primary); font-weight:600; } .paiement__titre { display:grid; gap:var(--space-1); margin-bottom:var(--space-5); } .paiement__titre p,.information { color:var(--color-text-muted); } .recap { padding:var(--space-1) var(--space-4); margin-bottom:var(--space-5); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); } .recap ul { margin:0; padding:0; list-style:none; } .recap li,.total { display:flex; justify-content:space-between; gap:var(--space-4); padding:var(--space-3) 0; border-bottom:1px solid var(--color-border); } .recap li div { display:grid; gap:var(--space-1); } .recap li span { color:var(--color-text-muted); font-size:14px; } .total { border:0; align-items:baseline; } .total strong { font-size:22px; } .information { margin-bottom:var(--space-5); } .squelette { padding:var(--space-5); background:var(--color-surface); }`,
})
export class PaiementPageComponent {
  private route = inject(ActivatedRoute); private router = inject(Router); private commandeService = inject(CommandeService);
  protected reseau = inject(NetworkService);
  protected commande = signal<Commande | null>(null); protected chargement = signal(true); protected initiationEnCours = signal(false); protected erreur = signal<string | null>(null);
  protected readonly commandeId = Number(this.route.snapshot.paramMap.get('id'));
  constructor() { this.charger(); }
  protected payer(commande: Commande): void {
    if (this.initiationEnCours()) return;
    this.initiationEnCours.set(true); this.erreur.set(null);
    this.commandeService.initierPaiement(commande.id).subscribe({ next: paiement => { if (!estUrlExterneValide(paiement.urlPaiement)) { this.erreur.set('Le lien de paiement reçu est invalide.'); this.initiationEnCours.set(false); return; } window.location.assign(paiement.urlPaiement); }, error: err => { this.erreur.set(messageErreur(err)); this.initiationEnCours.set(false); } });
  }
  private charger(): void { if (!Number.isSafeInteger(this.commandeId) || this.commandeId <= 0) { this.chargement.set(false); return; } this.commandeService.consulter(this.commandeId).subscribe({ next: commande => { this.commande.set(commande); this.chargement.set(false); }, error: () => this.chargement.set(false) }); }
}

export function estUrlExterneValide(url: string): boolean {
  try { const cible = new URL(url); return cible.protocol === 'https:'; } catch { return false; }
}
