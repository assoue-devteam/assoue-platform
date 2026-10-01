import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommandeService } from './commande.service';
import { estUrlExterneValide } from './paiement-page.component';

describe('commande et paiement', () => {
  let service: CommandeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CommandeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crée une commande avec les lignes du panier', () => {
    service.creer({ lignes: [{ produitId: 3, quantite: 2 }] }).subscribe();
    const requete = http.expectOne('/api/commandes');
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual({ lignes: [{ produitId: 3, quantite: 2 }] });
    requete.flush({ id: 10, statut: 'EN_ATTENTE_PAIEMENT', dateCreation: '2026-09-28T10:00:00', total: 5000, lignes: [] });
  });

  it('charge l’historique, le détail et initie le paiement par les routes attendues', () => {
    service.mesCommandes().subscribe();
    service.consulter(10).subscribe();
    service.initierPaiement(10).subscribe();
    const historique = http.expectOne('/api/commandes/mes-commandes');
    const detail = http.expectOne('/api/commandes/10');
    const paiement = http.expectOne('/api/paiements/commandes/10');
    expect(historique.request.method).toBe('GET');
    expect(detail.request.method).toBe('GET');
    expect(paiement.request.method).toBe('POST');
    expect(paiement.request.body).toEqual({});
    historique.flush([]);
    detail.flush({ id: 10, statut: 'EN_ATTENTE_PAIEMENT', dateCreation: '2026-09-28T10:00:00', total: 5000, lignes: [] });
    paiement.flush({ commandeId: 10, montant: 5000, statut: 'EN_ATTENTE', urlPaiement: 'https://paydunya.test/pay/abc' });
  });

  it('n’accepte qu’une URL HTTPS pour quitter l’application vers PayDunya', () => {
    expect(estUrlExterneValide('https://paydunya.test/pay/abc')).toBeTrue();
    expect(estUrlExterneValide('http://paydunya.test/pay/abc')).toBeFalse();
    expect(estUrlExterneValide('javascript:alert(1)')).toBeFalse();
    expect(estUrlExterneValide('invalide')).toBeFalse();
  });
});
