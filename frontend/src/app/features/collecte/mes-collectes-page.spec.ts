import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MesCollectesPageComponent } from './mes-collectes-page.component';
import { CollecteService } from './collecte.service';
import { Collecte, CollecteStatut } from '../../shared/models/api';

const collecte = (id: number, statut: CollecteStatut): Collecte => ({
  id, referenceClient: `ref-${id}`, statut, dateDeclaration: '2026-10-01T10:00:00', latitude: 12.37, longitude: -1.52,
  lignes: [{ materiau: 'Plastique', quantiteEstimee: 4 }],
});

registerLocaleData(localeFr);

describe('tableau de bord collecteur', () => {
  it('compte les collectes déclarées, validées (traitées comprises) et en attente de validation', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CollecteService, useValue: {
          mesCollectes: () => of([collecte(1, 'DECLAREE'), collecte(2, 'VALIDEE'), collecte(3, 'TRAITEE'), collecte(4, 'DECLAREE')]),
          enAttente: signal(0),
          synchroniser: () => of(),
        } },
      ],
    });
    const fixture = TestBed.createComponent(MesCollectesPageComponent);
    fixture.detectChanges();
    const valeurs = [...fixture.nativeElement.querySelectorAll('.compteurs strong')].map((el: HTMLElement) => el.textContent!.trim());
    expect(valeurs).toEqual(['4', '2', '2']);
  });
});
