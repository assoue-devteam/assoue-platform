import { Injectable, signal } from '@angular/core';

/**
 * Un seul panneau flottant ouvert à la fois : chaque panneau signale son ouverture
 * avec son id ; les autres se ferment quand l'id courant n'est plus le leur.
 * Petit registre, pas d'état de visibilité dupliqué : chaque composant garde son signal.
 */
@Injectable({ providedIn: 'root' })
export class PopupService {
  private actuel = signal<string | null>(null);
  readonly ouvert = this.actuel.asReadonly();

  signalerOuverture(id: string): void {
    this.actuel.set(id);
  }

  signalerFermeture(id: string): void {
    if (this.actuel() === id) this.actuel.set(null);
  }
}
