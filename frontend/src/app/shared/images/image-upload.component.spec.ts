import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageUploadComponent } from './image-upload.component';

describe("champ d'envoi d'image", () => {
  let http: HttpTestingController;

  function creer(apercu: string | null = null) {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ImageUploadComponent);
    const composant = fixture.componentInstance;
    if (apercu) {
      composant.apercu.set(apercu);
      fixture.detectChanges();
    }
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, composant, el };
  }

  /** Vraie image décodable (le navigateur refuse les faux contenus). */
  async function vraiJpeg(largeur = 64, hauteur = 48, nom = 'photo.jpg'): Promise<File> {
    const toile = document.createElement('canvas');
    toile.width = largeur;
    toile.height = hauteur;
    const contexte = toile.getContext('2d')!;
    contexte.fillStyle = '#E4002B';
    contexte.fillRect(0, 0, largeur, hauteur);
    const blob = await new Promise<Blob | null>(resolve => toile.toBlob(resolve, 'image/jpeg', 0.9));
    return new File([blob!], nom, { type: 'image/jpeg' });
  }

  function deposerFichier(el: HTMLElement, fichier: File, viaGlisser = false): void {    const champ = el.querySelector('input[type="file"]') as HTMLInputElement;
    if (viaGlisser) {
      const transfert = new DataTransfer();
      transfert.items.add(fichier);
      el.querySelector('.depot')!.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfert }));
    } else {
      Object.defineProperty(champ, 'files', { value: [fichier], configurable: true });
      champ.dispatchEvent(new Event('change'));
    }
  }

  /** Le redimensionnement passe par des files navigateur hors zone : on attend la requête. */
  async function attendreEnvoi(): Promise<TestRequest> {
    for (let i = 0; i < 100; i++) {
      const requetes = http.match({ method: 'POST', url: '/api/images' });
      if (requetes.length) return requetes[0];
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('envoi jamais parti');
  }

  async function attendreAlerte(
    fixture: ComponentFixture<ImageUploadComponent>, el: HTMLElement,
  ): Promise<HTMLElement> {
    for (let i = 0; i < 100; i++) {
      fixture.detectChanges();
      const cible = el.querySelector('[role="alert"]') as HTMLElement | null;
      if (cible) return cible;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('alerte jamais affichée');
  }

  afterEach(() => http.verify());

  it('téléverse un fichier valide et expose sa clé', async () => {
    const { fixture, composant, el } = creer();
    deposerFichier(el, await vraiJpeg());
    (await attendreEnvoi()).flush({ cle: 'cle-1.jpg' });
    fixture.detectChanges();

    expect(composant.cle()).toBe('cle-1.jpg');
    expect(el.querySelector('img')).toBeTruthy();
    expect(el.querySelector('[aria-live]')!.textContent).toContain('envoyée');
  });

  it('redimensionne avant l’envoi : JPEG de 2000 px au plus', async () => {
    const { fixture, el } = creer();
    deposerFichier(el, await vraiJpeg(3000, 100));
    const requete = await attendreEnvoi();
    const envoye = (requete.request.body as FormData).get('fichier') as File;
    expect(envoye.type).toBe('image/jpeg');
    const image = await createImageBitmap(envoye);
    expect(image.width).toBe(2000);
    expect(image.height).toBe(67);
    image.close();
    requete.flush({ cle: 'cle-1.jpg' });
    fixture.detectChanges();
  });

  it('refuse sans appel réseau ce que le navigateur ne décode pas', async () => {
    const { fixture, composant, el } = creer();
    deposerFichier(el, new File(['pas-une-image'], 'photo.jpg', { type: 'image/jpeg' }));
    const alerte = await attendreAlerte(fixture, el);
    fixture.detectChanges();

    expect(composant.cle()).toBeNull();
    http.expectNone({ method: 'POST' });
    expect(alerte.textContent).toContain('pas une image lisible');
    expect(alerte.querySelector('label')!.textContent).toContain('Réessayer');
  });

  it('refuse un format interdit sans appel réseau', async () => {
    const { fixture, el } = creer();
    deposerFichier(el, new File(['x'], 'photo.webp', { type: 'image/webp' }));
    const refus = await attendreAlerte(fixture, el);
    fixture.detectChanges();

    http.expectNone({ method: 'POST' });
    expect(refus.textContent).toContain('JPEG ou PNG');
  });

  it('remplace puis supprime la photo', async () => {
    const { fixture, composant, el } = creer();
    deposerFichier(el, await vraiJpeg(64, 48, 'a.jpg'));
    (await attendreEnvoi()).flush({ cle: 'cle-a.jpg' });
    fixture.detectChanges();

    deposerFichier(el, await vraiJpeg(64, 48, 'b.jpg'), true);
    (await attendreEnvoi()).flush({ cle: 'cle-b.jpg' });
    fixture.detectChanges();
    expect(composant.cle()).toBe('cle-b.jpg');

    (el.querySelector('.bouton--danger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(composant.cle()).toBeNull();
    expect(composant.apercu()).toBeNull();
    expect(el.querySelector('[aria-live]')!.textContent).toContain('supprimée');
  });

  it('annule un envoi en cours et restaure la clé précédente', async () => {
    const { fixture, composant, el } = creer();
    composant.cle.set('cle-avant.jpg');
    fixture.detectChanges();
    deposerFichier(el, await vraiJpeg(64, 48, 'b.jpg'));
    await attendreEnvoi();
    fixture.detectChanges();

    (el.querySelectorAll('.actions .bouton')[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(composant.cle()).toBe('cle-avant.jpg');
    expect(el.querySelector('[aria-live]')!.textContent).toContain('annulé');
  });

  it('reste utilisable au clavier seul', () => {
    const { el } = creer('https://cdn.example.com/ancien.jpg');
    const champ = el.querySelector('input[type="file"]') as HTMLInputElement;
    const etiquette = el.querySelector('label.bouton') as HTMLLabelElement;

    expect(champ.disabled).toBeFalse();
    expect(etiquette.getAttribute('for')).toBe(champ.id);
    expect(champ.getAttribute('accept')).toContain('image/jpeg');
    champ.focus();
    expect(document.activeElement).toBe(champ);
  });

  it('affiche l’aperçu initial et annonce les états', () => {
    const { el } = creer('https://cdn.example.com/ancien.jpg');
    const image = el.querySelector('img')!;
    expect(image.getAttribute('src')).toBe('https://cdn.example.com/ancien.jpg');
    expect(image.getAttribute('width')).toBe('320');
  });
});
