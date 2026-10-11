import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MouvementPoints, Signalement, SoldePoints, Zone } from '../../shared/models/api';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class SignalementService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getZones(): Observable<{ content: Zone[] }> {
    return this.http.get<{ content: Zone[] }>(`${this.apiUrl}/zones`);
  }

  creer(zoneId: number, description: string, photos: File[], latitude?: number | null, longitude?: number | null): Observable<Signalement> {
    const formData = new FormData();
    formData.append('zoneId', zoneId.toString());
    formData.append('description', description);
    if (latitude != null) formData.append('latitude', latitude.toString());
    if (longitude != null) formData.append('longitude', longitude.toString());
    for (const photo of photos) {
      formData.append('photos', photo);
    }
    return this.http.post<Signalement>(`${this.apiUrl}/signalements`, formData);
  }

  mesSignalements(page = 0, size = 10): Observable<PageResponse<Signalement>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Signalement>>(`${this.apiUrl}/signalements`, { params });
  }

  consulter(id: number): Observable<Signalement> {
    return this.http.get<Signalement>(`${this.apiUrl}/signalements/${id}`);
  }

  getSoldePoints(): Observable<SoldePoints> {
    return this.http.get<SoldePoints>(`${this.apiUrl}/points/solde`);
  }

  getMouvementsPoints(page = 0, size = 10): Observable<PageResponse<MouvementPoints>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<MouvementPoints>>(`${this.apiUrl}/points/mouvements`, { params });
  }

  valider(id: number, motifRejet?: string | null): Observable<Signalement> {
    return this.http.put<Signalement>(`${this.apiUrl}/signalements/${id}/valider`, { motifRejet: motifRejet || null });
  }
}
