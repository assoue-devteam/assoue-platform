import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, from, of, switchMap, tap, finalize, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Collecte, CollecteAdmin, CollecteStatut, DeclarationCollecteRequest, Materiau, VolumeCollecte } from '../../shared/models/api';
import { NetworkService } from '../../core/network.service';
import { CollecteLocale, CollecteStoreService } from './collecte-store.service';

@Injectable({ providedIn: 'root' })
export class CollecteService {
  private http = inject(HttpClient);
  private reseau = inject(NetworkService);
  private store = inject(CollecteStoreService);
  readonly synchronisationEnCours = signal(false);
  readonly enAttente = signal(0);

  constructor() {
    void this.actualiserFile();
    window.addEventListener('online', () => void this.synchroniser());
  }

  materiaux(): Observable<Materiau[]> {
    return this.http.get<Materiau[]>(`${environment.apiUrl}/collectes/materiaux`).pipe(
      tap(materiaux => void this.store.enregistrerMateriaux(materiaux)),
      catchError(error => error.status === 0 ? from(this.store.materiaux<Materiau>()) : throwError(() => error)),
    );
  }

  mesCollectes(): Observable<Collecte[]> {
    return this.http.get<Collecte[]>(`${environment.apiUrl}/collectes/mes-collectes`);
  }

  enregistrer(requete: DeclarationCollecteRequest): Observable<Collecte | null> {
    if (this.reseau.enLigne()) {
      return this.http.post<Collecte>(`${environment.apiUrl}/collectes`, requete).pipe(
        tap(() => void this.actualiserFile()),
        catchError(error => error.status === 0 ? from(this.enregistrerLocalement(requete)) : throwError(() => error)),
      );
    }
    return from(this.enregistrerLocalement(requete));
  }

  modifier(id: number, requete: Omit<DeclarationCollecteRequest, 'referenceClient'>): Observable<Collecte> {
    return this.http.put<Collecte>(`${environment.apiUrl}/collectes/${id}`, requete);
  }

  synchroniser(): Observable<number> {
    if (!this.reseau.enLigne() || this.synchronisationEnCours()) return of(0);
    this.synchronisationEnCours.set(true);
    return from(this.store.enAttente()).pipe(
      switchMap(file => from(this.envoyer(file))),
      tap(() => void this.actualiserFile()),
      finalize(() => this.synchronisationEnCours.set(false)),
    );
  }

  gestionCollectes(collecteurId?: number, statut?: CollecteStatut): Observable<CollecteAdmin[]> {
    let params = new HttpParams();
    if (collecteurId) params = params.set('collecteurId', collecteurId);
    if (statut) params = params.set('statut', statut);
    return this.http.get<CollecteAdmin[]>(`${environment.apiUrl}/collectes`, { params });
  }

  volumes(): Observable<VolumeCollecte[]> {
    return this.http.get<VolumeCollecte[]>(`${environment.apiUrl}/collectes/volumes`);
  }

  valider(id: number): Observable<Collecte> {
    return this.http.put<Collecte>(`${environment.apiUrl}/collectes/${id}/valider`, {});
  }

  traiter(id: number): Observable<Collecte> {
    return this.http.put<Collecte>(`${environment.apiUrl}/collectes/${id}/traiter`, {});
  }

  private async envoyer(file: CollecteLocale[]): Promise<number> {
    let synchronisees = 0;
    for (const declaration of file) {
      const { creeeLe: _creeeLe, ...requete } = declaration;
      await this.http.post<Collecte>(`${environment.apiUrl}/collectes`, requete).toPromise();
      await this.store.supprimer(declaration.referenceClient);
      synchronisees++;
    }
    return synchronisees;
  }

  private async enregistrerLocalement(requete: DeclarationCollecteRequest): Promise<null> {
    await this.store.enregistrer({ ...requete, creeeLe: new Date().toISOString() });
    await this.actualiserFile();
    return null;
  }

  private async actualiserFile(): Promise<void> {
    this.enAttente.set((await this.store.enAttente()).length);
  }
}
