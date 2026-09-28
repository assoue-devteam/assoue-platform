import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CollecteAdmin, CollecteStatut, CommandeAdmin, CommandeEnAttente, StockMatiere, StockProduit, UtilisateurAdmin, VolumeCollecte } from '../../shared/models/api';

@Injectable({ providedIn: 'root' })
export class GestionService {
  private http = inject(HttpClient);

  collectes(statut?: CollecteStatut): Observable<CollecteAdmin[]> {
    const params = statut ? new HttpParams().set('statut', statut) : undefined;
    return this.http.get<CollecteAdmin[]>(`${environment.apiUrl}/collectes`, { params });
  }

  volumes(): Observable<VolumeCollecte[]> { return this.http.get<VolumeCollecte[]>(`${environment.apiUrl}/collectes/volumes`); }
  validerCollecte(id: number): Observable<unknown> { return this.http.put(`${environment.apiUrl}/collectes/${id}/valider`, {}); }
  traiterCollecte(id: number): Observable<unknown> { return this.http.put(`${environment.apiUrl}/collectes/${id}/traiter`, {}); }
  commandes(statut?: string): Observable<CommandeAdmin[]> { const params = statut ? new HttpParams().set('statut', statut) : undefined; return this.http.get<CommandeAdmin[]>(`${environment.apiUrl}/commandes`, { params }); }
  commandesEnAttente(): Observable<CommandeEnAttente[]> { return this.http.get<CommandeEnAttente[]>(`${environment.apiUrl}/commandes/en-attente`); }
  stocksProduits(): Observable<StockProduit[]> { return this.http.get<StockProduit[]>(`${environment.apiUrl}/stocks/produits`); }
  stocksMatieres(): Observable<StockMatiere[]> { return this.http.get<StockMatiere[]>(`${environment.apiUrl}/stocks/matieres-premieres`); }
  ajusterStock(produitId: number, quantite: number): Observable<StockProduit> { return this.http.put<StockProduit>(`${environment.apiUrl}/stocks/produits/${produitId}`, { quantite }); }
  utilisateurs(verrouilles?: boolean): Observable<UtilisateurAdmin[]> { const params = verrouilles === undefined ? undefined : new HttpParams().set('verrouilles', verrouilles); return this.http.get<UtilisateurAdmin[]>(`${environment.apiUrl}/utilisateurs`, { params }); }
  debloquerUtilisateur(id: number): Observable<UtilisateurAdmin> { return this.http.post<UtilisateurAdmin>(`${environment.apiUrl}/utilisateurs/${id}/debloquer`, {}); }
}
