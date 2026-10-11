import { HttpEventType } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { IMAGE_TAILLE_MAX, ImageService, cheminImageCle, redimensionnerPourEnvoi, resoudreUrlImage, validerImageClient, validerTypeImageClient } from './image.service';

describe("service d'images", () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('valide le type et la taille côté client avec des messages français', () => {
    const jpeg = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validerImageClient(jpeg)).toBeNull();

    // file.type parfois vide : repli sur l'extension.
    const sansType = new File(['x'], 'photo.png', { type: '' });
    expect(validerImageClient(sansType)).toBeNull();

    expect(validerImageClient(new File(['x'], 'photo.webp', { type: 'image/webp' })))
      .toBe('Format accepté : JPEG ou PNG.');
    expect(validerImageClient(new File([new ArrayBuffer(IMAGE_TAILLE_MAX + 1)], 'gros.jpg', { type: 'image/jpeg' })))
      .toBe('L’image dépasse 10 Mo.');
    expect(validerTypeImageClient(new File(['x'], 'photo.jpg', { type: 'image/jpeg' }))).toBeNull();
  });

  it('résout les URL legacy et les chemins /api (même origine par défaut)', () => {
    expect(resoudreUrlImage(null)).toBeNull();
    expect(resoudreUrlImage('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
    expect(resoudreUrlImage('/api/images/abc.jpg')).toBe('/api/images/abc.jpg');
    expect(cheminImageCle('abc.jpg')).toBe('/api/images/abc.jpg');
  });

  it('émet la progression puis la clé', () => {
    const service = TestBed.inject(ImageService);
    const recues: ({ pourcentage: number } | { cle: string })[] = [];
    service.envoyer(new File(['contenu'], 'photo.jpg', { type: 'image/jpeg' })).subscribe(e => recues.push(e));

    const requete = http.expectOne({ method: 'POST', url: '/api/images' });
    expect(requete.request.body instanceof FormData).toBeTrue();
    requete.event({ type: HttpEventType.UploadProgress, loaded: 1, total: 2 });
    requete.flush({ cle: 'cle-1.jpg' });

    expect(recues).toEqual([{ pourcentage: 50 }, { cle: 'cle-1.jpg' }]);
  });

  it('redimensionne au plus grand côté 2000 px en JPEG avant l’envoi', async () => {
    const toile = document.createElement('canvas');
    toile.width = 3000;
    toile.height = 100;
    toile.getContext('2d')!.fillStyle = '#E4002B';
    toile.getContext('2d')!.fillRect(0, 0, 3000, 100);
    const blob = await new Promise<Blob | null>(resolve => toile.toBlob(resolve, 'image/jpeg', 0.9));
    const fichier = new File([blob!], 'photo.jpg', { type: 'image/jpeg' });

    const prete = await redimensionnerPourEnvoi(fichier);

    expect(prete.type).toBe('image/jpeg');
    expect(prete.name).toBe('photo.jpg');
    const image = await createImageBitmap(prete);
    expect(image.width).toBe(2000);
    expect(image.height).toBe(67);
    image.close();
  });

  it('refuse avec un message clair ce que le navigateur ne décode pas', async () => {
    let erreur: Error | null = null;
    try {
      await redimensionnerPourEnvoi(new File(['pas-une-image'], 'photo.jpg', { type: 'image/jpeg' }));
    } catch (e) {
      erreur = e as Error;
    }
    expect(erreur?.message).toContain('pas une image lisible');
  });
});
