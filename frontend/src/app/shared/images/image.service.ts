import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Taille max serveur (miroir de spring.servlet.multipart) : refus immédiat côté client, après redimensionnement. */
export const IMAGE_TAILLE_MAX = 10 * 1024 * 1024;
/** Plus grand côté après redimensionnement client, avant l'envoi. */
export const IMAGE_COTE_MAX_CLIENT = 2000;
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

/** Type accepté (JPEG ou PNG), ou null si le fichier passe le premier filtre (la vraie validation reste serveur). */
export function validerTypeImageClient(fichier: File): string | null {
  // file.type parfois vide (vieux navigateurs Android) : repli sur l'extension.
  const typeOk = IMAGE_TYPES.includes(fichier.type) || /\.(jpe?g|png)$/i.test(fichier.name);
  if (!typeOk) return 'Format accepté : JPEG ou PNG.';
  return null;
}

/**
 * Redimensionne avant l'envoi (photos smartphone 4032×3024 et plus) : le plus
 * grand côté passe à 2000 px, sortie JPEG qualité 0,85. L'orientation EXIF est
 * appliquée au décodage (`from-image`) puis perdue à dessein (le JPEG de canvas
 * n'embarque pas d'EXIF). PNG transparent → fond blanc. Le fichier renvoyé est
 * celui qui part au serveur.
 */
export async function redimensionnerPourEnvoi(fichier: File): Promise<File> {
  if (typeof createImageBitmap === 'undefined') {
    throw new Error('Votre navigateur ne peut pas préparer cette image : mettez-le à jour.');
  }
  let image: ImageBitmap;
  try {
    image = await createImageBitmap(fichier, { imageOrientation: 'from-image' });
  } catch {
    throw new Error("Ce fichier n'est pas une image lisible par votre navigateur.");
  }
  try {
    const echelle = Math.min(1, IMAGE_COTE_MAX_CLIENT / Math.max(image.width, image.height));
    const largeur = Math.max(1, Math.round(image.width * echelle));
    const hauteur = Math.max(1, Math.round(image.height * echelle));
    const toile = document.createElement('canvas');
    toile.width = largeur;
    toile.height = hauteur;
    const contexte = toile.getContext('2d');
    if (!contexte) throw new Error('Votre navigateur ne peut pas préparer cette image.');
    contexte.fillStyle = '#FFFFFF';
    contexte.fillRect(0, 0, largeur, hauteur);
    contexte.drawImage(image, 0, 0, largeur, hauteur);
    const blob = await new Promise<Blob | null>(resolve => toile.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('Votre navigateur ne peut pas préparer cette image.');
    return new File([blob], fichier.name.replace(/\.[^.]*$/, '') + '.jpg', { type: 'image/jpeg' });
  } finally {
    image.close();
  }
}

/** Message français précis, ou null si le fichier passe le premier filtre (la vraie validation reste serveur). */
export function validerImageClient(fichier: File): string | null {
  return validerTypeImageClient(fichier) ?? (fichier.size > IMAGE_TAILLE_MAX ? 'L’image dépasse 10 Mo.' : null);
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
