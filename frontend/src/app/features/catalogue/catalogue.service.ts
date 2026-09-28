import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categorie, Produit } from '../../shared/models/api';

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private http = inject(HttpClient);

  categories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${environment.apiUrl}/categories`);
  }

  produits(categorieId?: number): Observable<Produit[]> {
    const suffixe = categorieId === undefined ? '' : `?categorieId=${categorieId}`;
    return this.http.get<Produit[]>(`${environment.apiUrl}/produits${suffixe}`);
  }

  produit(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${environment.apiUrl}/produits/${id}`);
  }
}
