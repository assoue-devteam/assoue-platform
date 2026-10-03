import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { messageErreur } from '../../core/http/erreurs';
import { Produit } from '../../shared/models/api';
import { ToastService } from '../../shared/ui/toast';

const URL_FAVORIS = `${environment.apiUrl}/favoris`;

@Injectable({ providedIn: 'root' })
export class FavorisService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toasts = inject(ToastService);

  readonly produits = signal<Produit[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal(false);
  private ids = computed(() => new Set(this.produits().map(produit => produit.id)));

  constructor() {
    // Les favoris suivent le compte connecté ; seul un client en a.
    effect(() => {
      const email = this.auth.email();
      untracked(() => {
        this.produits.set([]);
        if (email && this.auth.aRole('CLIENT')) this.charger();
      });
    });
  }

  estFavori(produitId: number): boolean {
    return this.ids().has(produitId);
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(false);
    this.http.get<Produit[]>(URL_FAVORIS).subscribe({
      next: produits => { this.produits.set(produits); this.chargement.set(false); },
      error: () => { this.erreur.set(true); this.chargement.set(false); },
    });
  }

  /** Visiteur : on l'envoie se connecter, puis il revient sur la page qu'il regardait. */
  basculer(produit: Produit): void {
    if (!this.auth.aRole('CLIENT')) {
      this.router.navigate(['/connexion'], { queryParams: { retour: this.router.url } });
      return;
    }
    const avant = this.produits();
    const retirer = this.estFavori(produit.id);
    // Le cœur change tout de suite ; on revient en arrière si le serveur refuse.
    this.produits.set(retirer ? avant.filter(p => p.id !== produit.id) : [produit, ...avant]);
    const requete = retirer
      ? this.http.delete<void>(`${URL_FAVORIS}/${produit.id}`)
      : this.http.put<void>(`${URL_FAVORIS}/${produit.id}`, null);
    requete.subscribe({
      error: err => {
        this.produits.set(avant);
        this.toasts.erreur(messageErreur(err));
      },
    });
  }
}
