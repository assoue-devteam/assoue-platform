import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NetworkService } from '../../core/network.service';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { SrcImagePipe } from '../../shared/images/src-image.pipe';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { EmptyStateComponent } from '../../shared/ui/states';
import { PanierService } from './panier.service';
import { CommandeService } from '../commande/commande.service';
import { messageErreur } from '../../core/http/erreurs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterLink, FcfaPipe, SrcImagePipe, AlertComponent, ButtonDirective, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panier container"><h1>Panier</h1>
      @if (!panier.lignes().length) { <app-empty-state message="Votre panier est vide."><a routerLink="/" appButton="secondary">Voir le catalogue</a></app-empty-state> }
      @else { <div class="panier__grille"><div><ul class="lignes">
        @for (ligne of panier.lignes(); track ligne.produit.id) { <li class="ligne"><a [routerLink]="['/produits', ligne.produit.id]" class="ligne__image">@if (ligne.produit.imageUrl) { <img [src]="ligne.produit.imageUrl | srcImage" [alt]="ligne.produit.nom" /> } @else { <span aria-hidden="true">AS'SOUÉ</span> }</a><div class="ligne__detail"><a [routerLink]="['/produits', ligne.produit.id]">{{ ligne.produit.nom }}</a><span>{{ ligne.produit.prix | fcfa }} l'unité</span><button type="button" class="lien" (click)="panier.retirer(ligne.produit.id)">Retirer</button></div><div class="quantite" aria-label="Quantité"><button type="button" aria-label="Diminuer" (click)="panier.definirQuantite(ligne.produit.id, ligne.quantite - 1)">−</button><span>{{ ligne.quantite }}</span><button type="button" aria-label="Augmenter" (click)="panier.definirQuantite(ligne.produit.id, ligne.quantite + 1)">+</button></div><strong>{{ ligne.produit.prix * ligne.quantite | fcfa }}</strong></li> }
      </ul></div><aside class="resume"><div><span>Total</span><strong>{{ panier.total() | fcfa }}</strong></div>@if (erreur()) { <app-alert tone="error">{{ erreur() }}</app-alert> } @if (!reseau.enLigne()) { <app-alert tone="warning">La création de commande sera disponible lorsque vous serez reconnecté.</app-alert><button type="button" appButton="purchase" [block]="true" disabled>Commander</button> } @else if (!auth.connecte()) { <a routerLink="/connexion" [queryParams]="{ retour: '/panier' }" appButton="purchase" [block]="true">Commander</a><p>Vous serez invité à vous connecter.</p> } @else { <button type="button" appButton="purchase" [block]="true" [loading]="creationEnCours()" (click)="commander()">Commander</button> }</aside></div> }
    </section>`,
  styles: `.panier { padding-block:var(--space-6); } .panier h1 { margin-bottom:var(--space-5); } .panier__grille { display:grid; gap:var(--space-6); } .lignes { margin:0; padding:0; list-style:none; border-top:1px solid var(--color-border); } .ligne { display:grid; grid-template-columns:72px minmax(0,1fr); gap:var(--space-3); padding:var(--space-4) 0; border-bottom:1px solid var(--color-border); } .ligne__image { aspect-ratio:4/5; display:grid; place-items:center; background:var(--color-surface-alt); color:var(--color-primary-strong); font:600 12px var(--font-display); } .ligne__image img { width:100%; height:100%; object-fit:cover; } .ligne__detail { display:grid; align-content:start; gap:var(--space-1); } .ligne__detail a { color:var(--color-text); font-weight:600; text-decoration:none; } .ligne__detail span,.resume p { color:var(--color-text-muted); font-size:14px; } .lien { justify-self:start; min-height:36px; padding:0; border:0; background:none; color:var(--color-primary); font:600 15px var(--font-text); text-decoration:underline; cursor:pointer; } .quantite { display:inline-flex; align-items:center; border:1px solid var(--color-border-strong); border-radius:var(--radius-sm); width:max-content; } .quantite button { width:40px; height:40px; border:0; background:transparent; color:var(--color-primary); font-size:22px; cursor:pointer; } .quantite span { min-width:32px; text-align:center; font-weight:600; } .resume { display:grid; gap:var(--space-4); align-content:start; padding:var(--space-5); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); } .resume > div { display:flex; justify-content:space-between; align-items:baseline; } .resume strong { font-size:22px; } @media (min-width:768px) { .panier__grille { grid-template-columns:minmax(0,1fr) 320px; align-items:start; } .ligne { grid-template-columns:80px minmax(0,1fr) auto 120px; align-items:center; gap:var(--space-4); } .ligne > strong { text-align:right; } }`,
})
export class PanierPageComponent {
  protected panier = inject(PanierService);
  protected reseau = inject(NetworkService);
  protected auth = inject(AuthService);
  private commandeService = inject(CommandeService);
  private router = inject(Router);
  protected creationEnCours = signal(false);
  protected erreur = signal<string | null>(null);

  protected commander(): void {
    if (this.creationEnCours() || !this.panier.lignes().length) return;
    this.creationEnCours.set(true);
    this.erreur.set(null);
    this.commandeService.creer({ lignes: this.panier.lignes().map(ligne => ({ produitId: ligne.produit.id, quantite: ligne.quantite })) }).subscribe({
      next: commande => { this.panier.vider(); this.router.navigate(['/commandes', commande.id, 'paiement']); },
      error: err => { this.erreur.set(messageErreur(err)); this.creationEnCours.set(false); },
    });
  }
}
