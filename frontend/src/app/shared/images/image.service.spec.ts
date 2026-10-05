import { HttpEventType } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { IMAGE_TAILLE_MAX, ImageService, cheminImageCle, resoudreUrlImage, validerImageClient } from './image.service';

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
      .toBe('L’image dépasse 5 Mo.');
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
});
