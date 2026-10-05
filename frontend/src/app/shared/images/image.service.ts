import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Taille max serveur (miroir de spring.servlet.multipart) : refus immédiat côté client. */
export const IMAGE_TAILLE_MAX = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png'];

/** Progression (0-100) puis clé renvoyée par le serveur. Annulable par unsubscribe. */
export type ProgressionEnvoi = { pourcentage: number } | { cle: string };

@Injectable({ providedIn: 'root' })
export class ImageService {
  private http = inject(HttpClient);

  envoyer(fichier: File): Observable<ProgressionEnvoi> {
    const donnees = new FormData();
    donnees.append('fichier', fichier, fichier.name);
    return this.http
      .post<{ cle: string }>(`${environment.apiUrl}/images`, donnees, { reportProgress: true, observe: 'events' })
      .pipe(
        map(event => {
          if (event.type === HttpEventType.UploadProgress) {
            return { pourcentage: Math.round((100 * event.loaded) / (event.total ?? event.loaded)) };
          }
          if (event.type === HttpEventType.Response) return { cle: event.body!.cle };
          return null;
        }),
        filter((etape): etape is ProgressionEnvoi => etape !== null),
      );
  }
}

/** Message français précis, ou null si le fichier passe le premier filtre (la vraie validation reste serveur). */
export function validerImageClient(fichier: File): string | null {
  // file.type parfois vide (vieux navigateurs Android) : repli sur l'extension.
  const typeOk = IMAGE_TYPES.includes(fichier.type) || /\.(jpe?g|png)$/i.test(fichier.name);
  if (!typeOk) return 'Format accepté : JPEG ou PNG.';
  if (fichier.size > IMAGE_TAILLE_MAX) return 'L’image dépasse 5 Mo.';
  return null;
}

/** Chemin d'une clé d'image uploadée (contrat d'API : GET /api/images/{cle}). */
export function cheminImageCle(cle: string): string {
  return `/api/images/${cle}`;
}

/**
 * URL affichable d'une image produit/événement : https legacy telle quelle,
 * chemin /api résolu contre la base d'API configurée. En dev (proxy) comme en
 * prod monolithique apiUrl est relatif ('/api') : même origine, tel quel. Si un
 * jour le front et l'API sont sur des origines différentes (apiUrl absolue),
 * on préfixe avec l'origine de l'API.
 */
export function resoudreUrlImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  const base = environment.apiUrl;
  if (base.startsWith('http')) return new URL(base).origin + url;
  return url;
}
