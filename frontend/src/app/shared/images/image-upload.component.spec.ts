import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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

  function deposerFichier(el: HTMLElement, fichier: File, viaGlisser = false): void {
    const champ = el.querySelector('input[type="file"]') as HTMLInputElement;
    if (viaGlisser) {
      const transfert = new DataTransfer();
      transfert.items.add(fichier);
      el.querySelector('.depot')!.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfert }));
    } else {
      Object.defineProperty(champ, 'files', { value: [fichier], configurable: true });
      champ.dispatchEvent(new Event('change'));
    }
  }

  const jpeg = (nom = 'photo.jpg', contenu = 'contenu-jpeg') =>
    new File([contenu], nom, { type: 'image/jpeg' });

  afterEach(() => http.verify());

  it('téléverse un fichier valide et expose sa clé', () => {
    const { fixture, composant, el } = creer();
    deposerFichier(el, jpeg());

    http.expectOne({ method: 'POST', url: '/api/images' }).flush({ cle: 'cle-1.jpg' });
    fixture.detectChanges();

    expect(composant.cle()).toBe('cle-1.jpg');
    expect(el.querySelector('img')).toBeTruthy();
    expect(el.querySelector('[aria-live]')!.textContent).toContain('envoyée');
  });

  it('refuse un fichier trop gros sans appel réseau, avec réessai possible', () => {
    const { fixture, composant, el } = creer();
    deposerFichier(el, new File([new ArrayBuffer(6 * 1024 * 1024)], 'gros.jpg', { type: 'image/jpeg' }));
    fixture.detectChanges();

    expect(composant.cle()).toBeNull();
    http.expectNone({ method: 'POST' });
    const alerte = el.querySelector('[role="alert"]')!;
    expect(alerte.textContent).toContain('5 Mo');
    expect(alerte.querySelector('label')!.textContent).toContain('Réessayer');
  });

  it('remplace puis supprime la photo', () => {
    const { fixture, composant, el } = creer();
    deposerFichier(el, jpeg('a.jpg'));
    http.expectOne({ method: 'POST', url: '/api/images' }).flush({ cle: 'cle-a.jpg' });
    fixture.detectChanges();

    deposerFichier(el, jpeg('b.jpg'), true);
    http.expectOne({ method: 'POST', url: '/api/images' }).flush({ cle: 'cle-b.jpg' });
    fixture.detectChanges();
    expect(composant.cle()).toBe('cle-b.jpg');

    (el.querySelector('.bouton--danger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(composant.cle()).toBeNull();
    expect(composant.apercu()).toBeNull();
    expect(el.querySelector('[aria-live]')!.textContent).toContain('supprimée');
  });

  it('annule un envoi en cours et restaure la clé précédente', () => {
    const { fixture, composant, el } = creer();
    composant.cle.set('cle-avant.jpg');
    fixture.detectChanges();
    deposerFichier(el, jpeg('b.jpg'));
    http.expectOne({ method: 'POST', url: '/api/images' });
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
