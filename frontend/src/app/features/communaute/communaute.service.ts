import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChiffreCommunaute, Evenement, EvenementRequest } from '../../shared/models/api';

@Injectable({ providedIn: 'root' })
export class CommunauteService {
  private http = inject(HttpClient);
  private url = environment.apiUrl;

  evenements(): Observable<Evenement[]> { return this.http.get<Evenement[]>(`${this.url}/evenements`); }
  chiffres(): Observable<ChiffreCommunaute[]> { return this.http.get<ChiffreCommunaute[]>(`${this.url}/communaute/chiffres`); }

  creerEvenement(evenement: EvenementRequest): Observable<Evenement> { return this.http.post<Evenement>(`${this.url}/evenements`, evenement); }
  modifierEvenement(id: number, evenement: EvenementRequest): Observable<Evenement> { return this.http.put<Evenement>(`${this.url}/evenements/${id}`, evenement); }
  supprimerEvenement(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/evenements/${id}`); }
  remplacerChiffres(chiffres: ChiffreCommunaute[]): Observable<ChiffreCommunaute[]> {
    return this.http.put<ChiffreCommunaute[]>(`${this.url}/communaute/chiffres`, { chiffres });
  }
}

// Le bouton « Participer » ouvre WhatsApp avec un message prérempli : pas d'inscription gérée par le site.
// Numéro en configuration (chiffres, indicatif 226 inclus). Sans numéro valide,
// null : le template n'affiche alors aucun bouton plutôt qu'un lien cassé.
export function lienParticipation(evenement: Evenement, numero = environment.whatsappNumero): string | null {
  if (!/^226\d{8}$/.test(numero ?? '')) return null;
  const date = new Date(evenement.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const texte = `Bonjour AS'SOUÉ, je souhaite participer à « ${evenement.titre} » du ${date}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texte)}`;
}

/** Un événement de la journée reste « à venir » jusqu'au soir. */
export function estAVenir(evenement: Evenement, maintenant = new Date()): boolean {
  const debutDuJour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  return new Date(evenement.dateDebut) >= debutDuJour;
}
