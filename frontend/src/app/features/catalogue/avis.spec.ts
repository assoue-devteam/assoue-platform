import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../core/auth/auth.service';
import { EtoilesComponent } from '../../shared/ui/etoiles.component';
import { AvisSectionComponent } from './avis-section.component';

registerLocaleData(localeFr);

describe('avis', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('n\'affiche aucune étoile pour un produit sans avis', () => {
    const fixture = TestBed.createComponent(EtoilesComponent);
    fixture.componentRef.setInput('note', null);
    fixture.componentRef.setInput('nombre', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');

    fixture.componentRef.setInput('note', 4.5);
    fixture.componentRef.setInput('nombre', 12);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=img]').getAttribute('aria-label')).toBe('Note 4,5 sur 5, 12 avis');
  });

  const creer = () => {
    const fixture = TestBed.createComponent(AvisSectionComponent);
    fixture.componentRef.setInput('produitId', 4);
    fixture.detectChanges();
    TestBed.tick();
    return fixture;
  };
  const connecterClient = () => TestBed.inject(AuthService).session.set({ token: 't', email: 'awa@assoue.bf', roles: ['CLIENT'], expiration: Date.now() + 60_000 });

  it('visiteur : liste les avis sans demander son éligibilité', () => {
    const fixture = creer();
    http.expectOne('/api/produits/4/avis').flush({ moyenne: 5, nombre: 1, avis: [{ note: 5, commentaire: 'Solide', auteur: 'Awa O.', date: '2026-10-01T10:00:00' }] });
    http.expectNone('/api/produits/4/avis/moi');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Awa O.');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('client sans achat payé : pas de formulaire, explication', () => {
    connecterClient();
    const fixture = creer();
    http.expectOne('/api/produits/4/avis').flush({ moyenne: null, nombre: 0, avis: [] });
    http.expectOne('/api/produits/4/avis/moi').flush({ peutDonnerAvis: false, monAvis: null });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('après avoir acheté et payé');
  });

  it('acheteur : exige une note puis publie l\'avis', () => {
    connecterClient();
    const fixture = creer();
    http.expectOne('/api/produits/4/avis').flush({ moyenne: null, nombre: 0, avis: [] });
    http.expectOne('/api/produits/4/avis/moi').flush({ peutDonnerAvis: true, monAvis: null });
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Choisissez une note');
    http.expectNone({ method: 'PUT' });

    (fixture.nativeElement.querySelectorAll('input[type=radio]')[3] as HTMLInputElement).dispatchEvent(new Event('change'));
    form.dispatchEvent(new Event('submit'));
    const envoi = http.expectOne({ method: 'PUT', url: '/api/produits/4/avis' });
    expect(envoi.request.body.note).toBe(4);
    envoi.flush({ note: 4, commentaire: null, auteur: 'Awa O.', date: '2026-10-03T10:00:00' });
    http.expectOne('/api/produits/4/avis').flush({ moyenne: 4, nombre: 1, avis: [] });
    http.expectOne('/api/produits/4/avis/moi').flush({ peutDonnerAvis: true, monAvis: { note: 4, commentaire: null, auteur: 'Awa O.', date: '2026-10-03T10:00:00' } });
  });
});
