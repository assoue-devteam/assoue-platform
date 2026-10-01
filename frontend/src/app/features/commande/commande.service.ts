import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Commande, CommandeRequest, PaiementResponse } from '../../shared/models/api';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private http = inject(HttpClient);

  creer(requete: CommandeRequest): Observable<Commande> {
    return this.http.post<Commande>(`${environment.apiUrl}/commandes`, requete);
  }

  mesCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${environment.apiUrl}/commandes/mes-commandes`);
  }

  consulter(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${environment.apiUrl}/commandes/${id}`);
  }

  initierPaiement(commandeId: number): Observable<PaiementResponse> {
    return this.http.post<PaiementResponse>(`${environment.apiUrl}/paiements/commandes/${commandeId}`, {});
  }
}
