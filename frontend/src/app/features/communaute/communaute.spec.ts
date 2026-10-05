import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Evenement } from '../../shared/models/api';
import { GestionCommunautePageComponent } from '../admin/gestion-communaute-page.component';
import { CommunautePageComponent } from './communaute-page.component';
import { estAVenir, lienParticipation } from './communaute.service';

registerLocaleData(localeFr);

const evenement = (id: number, dateDebut: string, titre = `Atelier ${id}`): Evenement =>
  ({ id, titre, dateDebut, lieu: 'Ouagadougou', description: null, imageUrl: null, imageCle: null, placesRestantes: null });

describe('communauté', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('garde « à venir » un événement du jour même après son heure de début', () => {
    const maintenant = new Date(2026, 9, 3, 18, 0);
    expect(estAVenir(evenement(1, '2026-10-03T09:00:00'), maintenant)).toBeTrue();
    expect(estAVenir(evenement(2, '2026-10-02T09:00:00'), maintenant)).toBeFalse();
  });

  it('prépare un message WhatsApp avec le titre et la date', () => {
    const lien = lienParticipation(evenement(1, '2026-12-15T09:00:00', 'Atelier de recyclage créatif'));
    expect(lien.startsWith('https://wa.me/22654958282?text=')).toBeTrue();
    expect(decodeURIComponent(lien)).toContain('« Atelier de recyclage créatif » du 15 décembre 2026');
  });

  it('sépare les événements à venir des événements passés', () => {
    const fixture = TestBed.createComponent(CommunautePageComponent);
    http.expectOne('/api/communaute/chiffres').flush([{ libelle: 'Artisans soutenus', valeur: 245 }]);
    http.expectOne('/api/evenements').flush([evenement(1, '2020-01-10T09:00:00', 'Salon 2020'), evenement(2, '2099-12-15T09:00:00', 'Atelier 2099')]);
    fixture.detectChanges();
    const texte = (selecteur: string) => [...fixture.nativeElement.querySelectorAll(selecteur)].map((el: HTMLElement) => el.textContent!.trim());
    expect(texte('.evenement h3')).toEqual(['Atelier 2099']);
    expect(texte('.passes strong')).toEqual(['Salon 2020']);
    expect(texte('.chiffre span')).toEqual(['Artisans soutenus']);
  });

  it('admin : publie un événement avec les champs vides envoyés à null', () => {
    const fixture = TestBed.createComponent(GestionCommunautePageComponent);
    http.expectOne('/api/evenements').flush([]);
    http.expectOne('/api/communaute/chiffres').flush([]);
    fixture.detectChanges();
    const page = fixture.componentInstance as unknown as { formulaire: GestionCommunautePageComponent['formulaire']; enregistrer(): void };
    page.formulaire.setValue({ titre: 'Atelier', dateDebut: '2026-12-15T09:00', lieu: 'Ouagadougou', description: '', placesRestantes: null });
    page.enregistrer();
    const creation = http.expectOne({ method: 'POST', url: '/api/evenements' });
    expect(creation.request.body).toEqual({ titre: 'Atelier', dateDebut: '2026-12-15T09:00', lieu: 'Ouagadougou', description: null, imageUrl: null, imageCle: null, placesRestantes: null });
    creation.flush(evenement(1, '2026-12-15T09:00:00'));
    http.expectOne('/api/evenements').flush([]);
  });

  it('admin : envoie la clé téléversée en priorité sur l’URL legacy', () => {
    const fixture = TestBed.createComponent(GestionCommunautePageComponent);
    http.expectOne('/api/evenements').flush([]);
    http.expectOne('/api/communaute/chiffres').flush([]);
    fixture.detectChanges();
    const page = fixture.componentInstance as unknown as {
      formulaire: GestionCommunautePageComponent['formulaire'];
      imageCle: { set(cle: string | null): void };
      imageLegacy: { set(url: string | null): void };
      enregistrer(): void;
    };
    page.formulaire.setValue({ titre: 'Atelier', dateDebut: '2026-12-15T09:00', lieu: 'Ouaga', description: '', placesRestantes: null });
    page.imageCle.set('cle-1.jpg');
    page.imageLegacy.set('https://cdn.example.com/ancien.jpg');
    page.enregistrer();
    const creation = http.expectOne({ method: 'POST', url: '/api/evenements' });
    expect(creation.request.body).toEqual({ titre: 'Atelier', dateDebut: '2026-12-15T09:00', lieu: 'Ouaga', description: null, imageUrl: null, imageCle: 'cle-1.jpg', placesRestantes: null });
    creation.flush(evenement(1, '2026-12-15T09:00:00'));
    http.expectOne('/api/evenements').flush([]);
  });
});
