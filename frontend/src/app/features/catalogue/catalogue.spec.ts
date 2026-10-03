import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CatalogueService } from './catalogue.service';
import { PanierService } from './panier.service';
import { Produit } from '../../shared/models/api';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/ui/toast';

const produit: Produit = {
  id: 7, nom: 'Bracelet recyclé', description: 'Un bracelet.', prix: 2500,
  imageUrl: null, categorie: 'Bijoux', enRupture: false,
};

describe('catalogue et panier', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('appelle les endpoints publics du catalogue', () => {
    const service = TestBed.inject(CatalogueService);
    const http = TestBed.inject(HttpTestingController);
    service.categories().subscribe();
    service.produits().subscribe();
    service.produits(3).subscribe();
    service.produit(7).subscribe();
    const categories = http.expectOne('/api/categories');
    const produits = http.expectOne('/api/produits');
    const produitsFiltres = http.expectOne('/api/produits?categorieId=3');
    const fiche = http.expectOne('/api/produits/7');
    expect(categories.request.method).toBe('GET');
    expect(produits.request.method).toBe('GET');
    expect(produitsFiltres.request.method).toBe('GET');
    expect(fiche.request.method).toBe('GET');
    categories.flush([]);
    produits.flush([]);
    produitsFiltres.flush([]);
    fiche.flush(produit);
  });

  it('persiste le panier, additionne une ligne identique et recalcule le total', () => {
    const panier = TestBed.inject(PanierService);
    panier.ajouter(produit);
    panier.ajouter(produit);
    expect(panier.nombreArticles()).toBe(2);
    expect(panier.total()).toBe(5000);
    expect(JSON.parse(localStorage.getItem('assoue.panier')!)[0].quantite).toBe(2);
    panier.definirQuantite(produit.id, 0);
    expect(panier.lignes()).toEqual([]);
  });

  it('refuse une addition en rupture', () => {
    const panier = TestBed.inject(PanierService);
    panier.ajouter({ ...produit, enRupture: true });
    expect(panier.lignes()).toEqual([]);
  });

  describe('panier par compte (admin, collecteur : sans panier serveur)', () => {
    const connecter = (email: string) => {
      TestBed.inject(AuthService).session.set({ token: 't', email, roles: ['ADMIN'], expiration: Date.now() + 60_000 });
      TestBed.tick();
    };

    it('masque le panier à la déconnexion et le rend à la reconnexion', () => {
      const panier = TestBed.inject(PanierService);
      connecter('issa@assoue.bf');
      panier.ajouter(produit);
      TestBed.inject(AuthService).deconnecter();
      TestBed.tick();
      expect(panier.lignes()).toEqual([]);
      connecter('issa@assoue.bf');
      expect(panier.nombreArticles()).toBe(1);
    });

    it('ne montre pas le panier d\'un compte à un autre compte', () => {
      const panier = TestBed.inject(PanierService);
      connecter('issa@assoue.bf');
      panier.ajouter(produit);
      connecter('moussa@assoue.bf');
      expect(panier.lignes()).toEqual([]);
    });
  });

  describe('panier serveur du client', () => {
    let http: HttpTestingController;
    const sessionClient = { token: 't', email: 'awa@assoue.bf', roles: ['CLIENT' as const], expiration: Date.now() + 60_000 };
    const reponse = (quantite: number, prix = produit.prix) =>
      ({ lignes: quantite ? [{ produit: { ...produit, prix }, quantite }] : [], total: prix * quantite });

    beforeEach(() => http = TestBed.inject(HttpTestingController));

    it('additionne le panier visiteur au panier serveur à la connexion', () => {
      const panier = TestBed.inject(PanierService);
      TestBed.tick();
      panier.ajouter(produit);
      TestBed.inject(AuthService).session.set(sessionClient);
      TestBed.tick();
      http.expectOne({ method: 'GET', url: '/api/panier' }).flush(reponse(2));
      const envoi = http.expectOne({ method: 'PUT', url: '/api/panier' });
      expect(envoi.request.body).toEqual({ lignes: [{ produitId: 7, quantite: 3 }] });
      envoi.flush(reponse(3));
      expect(panier.nombreArticles()).toBe(3);
      expect(localStorage.getItem('assoue.panier')).toBeNull();
    });

    it('reprend au démarrage le panier serveur avec le prix à jour', () => {
      localStorage.setItem('assoue.session', JSON.stringify(sessionClient));
      const panier = TestBed.inject(PanierService);
      TestBed.tick();
      http.expectOne('/api/panier').flush(reponse(2, 3000));
      expect(panier.nombreArticles()).toBe(2);
      expect(panier.total()).toBe(6000);
    });

    it('annule l\'ajout et affiche le message du serveur si le stock est insuffisant', () => {
      localStorage.setItem('assoue.session', JSON.stringify(sessionClient));
      const panier = TestBed.inject(PanierService);
      TestBed.tick();
      http.expectOne('/api/panier').flush(reponse(1));
      panier.ajouter(produit);
      expect(panier.nombreArticles()).toBe(2);
      http.expectOne({ method: 'PUT', url: '/api/panier' }).flush(
        { statut: 400, message: 'Stock insuffisant pour « Bracelet recyclé » : 1 disponible(s)' },
        { status: 400, statusText: 'Bad Request' });
      expect(panier.nombreArticles()).toBe(1);
      expect(TestBed.inject(ToastService).toasts()[0].message).toContain('1 disponible(s)');
    });

    it('garde l\'ajout hors ligne et le renvoie au retour du réseau', () => {
      localStorage.setItem('assoue.session', JSON.stringify(sessionClient));
      const panier = TestBed.inject(PanierService);
      TestBed.tick();
      http.expectOne('/api/panier').flush(reponse(0));
      panier.ajouter(produit);
      http.expectOne({ method: 'PUT', url: '/api/panier' }).error(new ProgressEvent('error'));
      expect(panier.nombreArticles()).toBe(1);

      window.dispatchEvent(new Event('offline'));
      TestBed.tick();
      window.dispatchEvent(new Event('online'));
      TestBed.tick();
      const renvoi = http.expectOne({ method: 'PUT', url: '/api/panier' });
      expect(renvoi.request.body).toEqual({ lignes: [{ produitId: 7, quantite: 1 }] });
      renvoi.flush(reponse(1));
      expect(localStorage.getItem('assoue.panier.awa@assoue.bf.aEnvoyer')).toBeNull();
    });

    it('rejoue sur le panier serveur un ajout fait pendant son chargement', () => {
      localStorage.setItem('assoue.session', JSON.stringify(sessionClient));
      const panier = TestBed.inject(PanierService);
      TestBed.tick();
      const chargement = http.expectOne({ method: 'GET', url: '/api/panier' });
      panier.ajouter(produit);
      http.expectNone({ method: 'PUT', url: '/api/panier' });
      chargement.flush(reponse(2));
      expect(panier.nombreArticles()).toBe(3);
      const envoi = http.expectOne({ method: 'PUT', url: '/api/panier' });
      expect(envoi.request.body).toEqual({ lignes: [{ produitId: 7, quantite: 3 }] });
      envoi.flush(reponse(3));
    });

    it('garde un ajout fait pendant un chargement qui échoue et le marque à envoyer', () => {
      localStorage.setItem('assoue.session', JSON.stringify(sessionClient));
      const panier = TestBed.inject(PanierService);
      TestBed.tick();
      const chargement = http.expectOne({ method: 'GET', url: '/api/panier' });
      panier.ajouter(produit);
      chargement.error(new ProgressEvent('error'));
      expect(panier.nombreArticles()).toBe(1);
      expect(localStorage.getItem('assoue.panier.awa@assoue.bf.aEnvoyer')).toBe('1');
    });

    it('envoie les modifications restées en attente plutôt que d\'écraser avec le serveur', () => {
      localStorage.setItem('assoue.session', JSON.stringify(sessionClient));
      localStorage.setItem('assoue.panier.awa@assoue.bf', JSON.stringify([{ produit, quantite: 4 }]));
      localStorage.setItem('assoue.panier.awa@assoue.bf.aEnvoyer', '1');
      TestBed.inject(PanierService);
      TestBed.tick();
      http.expectNone({ method: 'GET', url: '/api/panier' });
      const envoi = http.expectOne({ method: 'PUT', url: '/api/panier' });
      expect(envoi.request.body).toEqual({ lignes: [{ produitId: 7, quantite: 4 }] });
      envoi.flush(reponse(4));
    });
  });
});
