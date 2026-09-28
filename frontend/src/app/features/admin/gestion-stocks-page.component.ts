import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StockMatiere, StockProduit } from '../../shared/models/api';
import { GestionService } from './gestion.service';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';

@Component({
  standalone: true,
  imports: [FormsModule, AlertComponent, ButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="gestion-page"><div><p class="eyebrow">Gestion</p><h1>Stocks</h1></div>@if (message()) { <app-alert [tone]="messageTone()">{{ message() }}</app-alert> }<section><h2>Produits finis</h2><div class="liste">@for (stock of produits(); track stock.produitId) { <div class="ligne"><span>{{ stock.produitNom }}</span><div class="edition"><input type="number" min="0" [(ngModel)]="editions[stock.produitId]" [attr.aria-label]="'Stock de ' + stock.produitNom" /><button type="button" appButton="secondary" (click)="enregistrer(stock)">Enregistrer</button></div></div> } @empty { <p>Aucun stock produit.</p> }</div></section><section><h2>Matières premières</h2><div class="liste">@for (stock of matieres(); track stock.materiauId) { <div class="ligne"><span>{{ stock.materiauNom }}</span><strong>{{ stock.quantite }}</strong></div> } @empty { <p>Aucun stock matière.</p> }</div></section></section>` ,
  styles: `.gestion-page { display:grid; gap:var(--space-6); } .eyebrow { color:var(--color-primary); font-weight:600; } section { display:grid; gap:var(--space-3); } .liste { border-top:1px solid var(--color-border); } .ligne { display:flex; justify-content:space-between; align-items:center; gap:var(--space-3); padding:var(--space-3) 0; border-bottom:1px solid var(--color-border); } .edition { display:flex; gap:var(--space-2); align-items:center; } input { width:90px; min-height:40px; padding:8px; border:1px solid var(--color-border-strong); }`,
})
export class GestionStocksPageComponent {
  private service = inject(GestionService); protected produits = signal<StockProduit[]>([]); protected matieres = signal<StockMatiere[]>([]); protected editions: Record<number, number> = {}; protected message = signal<string | null>(null); protected messageTone = signal<'success' | 'error'>('success');
  constructor() { this.charger(); }
  private charger(): void { this.service.stocksProduits().subscribe(produits => { this.produits.set(produits); for (const stock of produits) this.editions[stock.produitId] = stock.quantite; }); this.service.stocksMatieres().subscribe(matieres => this.matieres.set(matieres)); }
  protected enregistrer(stock: StockProduit): void { const quantite = Number(this.editions[stock.produitId]); if (!Number.isInteger(quantite) || quantite < 0) { this.message.set('Saisissez une quantité entière positive.'); this.messageTone.set('error'); return; } this.service.ajusterStock(stock.produitId, quantite).subscribe({ next: () => { this.message.set('Stock mis à jour.'); this.messageTone.set('success'); this.charger(); }, error: () => { this.message.set('La mise à jour du stock a échoué.'); this.messageTone.set('error'); } }); }
}
