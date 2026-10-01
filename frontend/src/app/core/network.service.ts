import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private navigateur = signal(navigator.onLine);
  // Panne constatée sur l'API (statut 0) alors que le navigateur se dit en ligne
  // (backend coupé, wifi sans sortie...) : l'UI doit refléter l'usage réel.
  private echecApi = signal(false);

  readonly enLigne = computed(() => this.navigateur() && !this.echecApi());

  constructor() {
    const reconnecte = () => { this.navigateur.set(true); this.echecApi.set(false); };
    const deconnecte = () => this.navigateur.set(false);
    window.addEventListener('online', reconnecte);
    window.addEventListener('offline', deconnecte);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', reconnecte);
      window.removeEventListener('offline', deconnecte);
    });
  }

  /** Niveau navigateur brut, pour les tentatives de resynchronisation. */
  navigateurEnLigne(): boolean {
    return this.navigateur();
  }

  /** Une requête API a abouti : tout refonctionne. */
  marquerSuccesApi(): void {
    this.echecApi.set(false);
  }

  /** Une requête API a échoué sans réponse (statut 0). */
  marquerEchecApi(): void {
    if (this.navigateur()) this.echecApi.set(true);
  }
}
