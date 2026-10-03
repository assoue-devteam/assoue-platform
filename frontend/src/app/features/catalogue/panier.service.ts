import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { messageErreur } from '../../core/http/erreurs';
import { NetworkService } from '../../core/network.service';
import { Panier, Produit } from '../../shared/models/api';
import { ToastService } from '../../shared/ui/toast';

export interface LignePanier {
  produit: Pick<Produit, 'id' | 'nom' | 'prix' | 'imageUrl' | 'categorie' | 'enRupture'>;
  quantite: number;
}

type Operation = (lignes: LignePanier[]) => LignePanier[];

interface Envoi {
  cle: string;
  lignes: LignePanier[];
  siRefus: LignePanier[];
}

const URL_PANIER = `${environment.apiUrl}/panier`;
const CLE_PANIER_VISITEUR = 'assoue.panier';

// Copie locale par compte : sert hors ligne et pour les comptes sans panier serveur (admin, collecteur).
const cleDuPanier = (email: string | null) => email ? `${CLE_PANIER_VISITEUR}.${email}` : CLE_PANIER_VISITEUR;
// Posée avant chaque envoi, retirée quand le serveur a répondu : survit à une coupure ou à un onglet fermé.
const cleEnAttente = (cle: string) => `${cle}.aEnvoyer`;

/**
 * Visiteur : panier dans le navigateur. Client connecté : le serveur fait foi (GET/PUT /api/panier),
 * pour retrouver le panier sur tout appareil ; la copie locale permet d'ajouter hors ligne (DS §état réseau).
 */
@Injectable({ providedIn: 'root' })
export class PanierService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private reseau = inject(NetworkService);
  private toasts = inject(ToastService);
  private cle = cleDuPanier(this.auth.email());
  private initialise = false;
  private operationsPendantSynchro: Operation[] | null = null;
  private envois = new Subject<Envoi>();

  readonly lignes = signal<LignePanier[]>(lirePanier(this.cle));
  readonly nombreArticles = computed(() => this.lignes().reduce((total, ligne) => total + ligne.quantite, 0));
  readonly total = computed(() => this.lignes().reduce((total, ligne) => total + ligne.produit.prix * ligne.quantite, 0));

  constructor() {
    effect(() => {
      const cle = cleDuPanier(this.auth.email());
      untracked(() => this.changerDePanier(cle));
    });

    let etaitEnLigne = this.reseau.enLigne();
    effect(() => {
      const enLigne = this.reseau.enLigne();
      if (enLigne && !etaitEnLigne) untracked(() => { if (this.enAttente()) this.envoyer(this.lignes(), this.lignes()); });
      etaitEnLigne = enLigne;
    });

    // switchMap : seul le dernier état du panier compte, PUT remplace tout côté serveur.
    this.envois.pipe(switchMap(envoi => this.http.put<Panier>(URL_PANIER, versRequete(envoi.lignes)).pipe(
      map(panier => ({ envoi, panier, erreur: null })),
      catchError((erreur: HttpErrorResponse) => of({ envoi, panier: null, erreur })),
    ))).subscribe(({ envoi, panier, erreur }) => this.recevoir(envoi, panier, erreur));
  }

  ajouter(produit: Produit): void {
    if (produit.enRupture) return;
    this.modifier(lignes => {
      const index = lignes.findIndex(ligne => ligne.produit.id === produit.id);
      if (index === -1) return [...lignes, { produit: produitSnapshot(produit), quantite: 1 }];
      return lignes.map((ligne, i) => i === index ? { ...ligne, quantite: ligne.quantite + 1 } : ligne);
    });
  }

  definirQuantite(produitId: number, quantite: number): void {
    this.modifier(lignes => quantite <= 0
      ? lignes.filter(ligne => ligne.produit.id !== produitId)
      : lignes.map(ligne => ligne.produit.id === produitId ? { ...ligne, quantite } : ligne));
  }

  retirer(produitId: number): void {
    this.modifier(lignes => lignes.filter(ligne => ligne.produit.id !== produitId));
  }

  vider(): void {
    this.modifier(() => []);
  }

  private modifier(operation: Operation): void {
    const precedent = this.lignes();
    const prochain = operation(precedent);
    this.enregistrer(prochain);
    // Panier serveur pas encore reçu : on rejouera l'opération dessus, l'envoyer maintenant l'écraserait.
    if (this.operationsPendantSynchro) this.operationsPendantSynchro.push(operation);
    else if (this.auth.aRole('CLIENT')) this.envoyer(prochain, precedent);
  }

  // Le panier rempli en visiteur rejoint celui du compte à la connexion (DS : « Votre panier est conservé »).
  private changerDePanier(cle: string): void {
    // Premier passage : rien à fusionner, mais un client doit récupérer son panier serveur.
    if (this.initialise && cle === this.cle) return;
    const panierVisiteur = this.initialise && this.cle === CLE_PANIER_VISITEUR ? this.lignes() : [];
    this.initialise = true;
    this.cle = cle;
    this.operationsPendantSynchro = null;
    this.lignes.set(lirePanier(cle));
    if (panierVisiteur.length > 0) {
      localStorage.removeItem(CLE_PANIER_VISITEUR);
      this.enregistrer(fusionner(this.lignes(), panierVisiteur));
    }
    if (this.auth.aRole('CLIENT')) this.synchroniser(panierVisiteur);
  }

  private synchroniser(panierVisiteur: LignePanier[]): void {
    // Des modifications faites hors ligne sur cet appareil passent avant la version serveur.
    if (this.enAttente()) {
      this.envoyer(this.lignes(), this.lignes());
      return;
    }
    const cle = this.cle;
    const operations: Operation[] = [];
    this.operationsPendantSynchro = operations;
    this.http.get<Panier>(URL_PANIER).subscribe({
      next: panier => {
        if (this.operationsPendantSynchro !== operations) return;
        this.operationsPendantSynchro = null;
        const base = fusionner(versLignes(panier), panierVisiteur);
        const lignes = operations.reduce((resultat, operation) => operation(resultat), base);
        this.enregistrer(lignes);
        if (panierVisiteur.length > 0 || operations.length > 0) this.envoyer(lignes, base);
      },
      // Hors ligne : la copie locale (déjà fusionnée et modifiée) sera envoyée au retour du réseau.
      error: () => {
        if (this.operationsPendantSynchro === operations) this.operationsPendantSynchro = null;
        if (panierVisiteur.length > 0 || operations.length > 0) localStorage.setItem(cleEnAttente(cle), '1');
      },
    });
  }

  private envoyer(lignes: LignePanier[], siRefus: LignePanier[]): void {
    localStorage.setItem(cleEnAttente(this.cle), '1');
    this.envois.next({ cle: this.cle, lignes, siRefus });
  }

  private recevoir(envoi: Envoi, panier: Panier | null, erreur: HttpErrorResponse | null): void {
    if (envoi.cle !== this.cle) return;
    if (panier) {
      localStorage.removeItem(cleEnAttente(envoi.cle));
      // Prix et ruptures à jour depuis le serveur.
      this.enregistrer(versLignes(panier));
      return;
    }
    // Pas de réponse ou session expirée : on garde la modification, elle repartira plus tard.
    if (!erreur || erreur.status === 0 || erreur.status === 401 || erreur.status === 403) return;
    // Refus métier (stock insuffisant, produit retiré) : le serveur n'a rien changé.
    localStorage.removeItem(cleEnAttente(envoi.cle));
    this.enregistrer(envoi.siRefus);
    this.toasts.erreur(messageErreur(erreur));
  }

  private enAttente(): boolean {
    return this.auth.aRole('CLIENT') && localStorage.getItem(cleEnAttente(this.cle)) !== null;
  }

  private enregistrer(lignes: LignePanier[]): void {
    this.lignes.set(lignes);
    localStorage.setItem(this.cle, JSON.stringify(lignes));
  }
}

function versRequete(lignes: LignePanier[]) {
  return { lignes: lignes.map(ligne => ({ produitId: ligne.produit.id, quantite: ligne.quantite })) };
}

function versLignes(panier: Panier): LignePanier[] {
  return panier.lignes.map(ligne => ({ produit: produitSnapshot(ligne.produit), quantite: ligne.quantite }));
}

function fusionner(lignes: LignePanier[], ajouts: LignePanier[]): LignePanier[] {
  return ajouts.reduce((resultat, ajout) => {
    const existante = resultat.find(ligne => ligne.produit.id === ajout.produit.id);
    return existante
      ? resultat.map(ligne => ligne === existante ? { ...ligne, quantite: ligne.quantite + ajout.quantite } : ligne)
      : [...resultat, ajout];
  }, lignes);
}

function produitSnapshot(produit: LignePanier['produit']): LignePanier['produit'] {
  const { id, nom, prix, imageUrl, categorie, enRupture } = produit;
  return { id, nom, prix, imageUrl, categorie, enRupture };
}

function lirePanier(cle: string): LignePanier[] {
  try {
    const valeur = JSON.parse(localStorage.getItem(cle) ?? '[]') as unknown;
    return Array.isArray(valeur) ? valeur.filter(estLignePanier) : [];
  } catch {
    return [];
  }
}

function estLignePanier(valeur: unknown): valeur is LignePanier {
  if (!valeur || typeof valeur !== 'object') return false;
  const ligne = valeur as Partial<LignePanier>;
  return typeof ligne.quantite === 'number' && ligne.quantite > 0
    && !!ligne.produit && typeof ligne.produit.id === 'number'
    && typeof ligne.produit.nom === 'string' && typeof ligne.produit.prix === 'number';
}
