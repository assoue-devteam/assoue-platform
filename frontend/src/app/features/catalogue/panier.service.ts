import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Produit } from '../../shared/models/api';

export interface LignePanier {
  produit: Pick<Produit, 'id' | 'nom' | 'prix' | 'imageUrl' | 'categorie' | 'enRupture'>;
  quantite: number;
}

const CLE_PANIER_VISITEUR = 'assoue.panier';

// Un panier par compte, conservé dans ce navigateur d'une connexion à l'autre.
const cleDuPanier = (email: string | null) => email ? `${CLE_PANIER_VISITEUR}.${email}` : CLE_PANIER_VISITEUR;

@Injectable({ providedIn: 'root' })
export class PanierService {
  private auth = inject(AuthService);
  private cle = cleDuPanier(this.auth.email());

  readonly lignes = signal<LignePanier[]>(lirePanier(this.cle));
  readonly nombreArticles = computed(() => this.lignes().reduce((total, ligne) => total + ligne.quantite, 0));
  readonly total = computed(() => this.lignes().reduce((total, ligne) => total + ligne.produit.prix * ligne.quantite, 0));

  constructor() {
    effect(() => {
      const cle = cleDuPanier(this.auth.email());
      untracked(() => this.changerDePanier(cle));
    });
  }

  // Le panier rempli en visiteur rejoint celui du compte à la connexion (DS : « Votre panier est conservé »).
  private changerDePanier(cle: string): void {
    if (cle === this.cle) return;
    const panierVisiteur = this.cle === CLE_PANIER_VISITEUR ? this.lignes() : [];
    this.cle = cle;
    this.lignes.set(lirePanier(cle));
    if (panierVisiteur.length > 0) {
      localStorage.removeItem(CLE_PANIER_VISITEUR);
      this.modifier(lignes => fusionner(lignes, panierVisiteur));
    }
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

  private modifier(operation: (lignes: LignePanier[]) => LignePanier[]): void {
    const prochain = operation(this.lignes());
    this.lignes.set(prochain);
    localStorage.setItem(this.cle, JSON.stringify(prochain));
  }
}

function fusionner(lignes: LignePanier[], ajouts: LignePanier[]): LignePanier[] {
  return ajouts.reduce((resultat, ajout) => {
    const existante = resultat.find(ligne => ligne.produit.id === ajout.produit.id);
    return existante
      ? resultat.map(ligne => ligne === existante ? { ...ligne, quantite: ligne.quantite + ajout.quantite } : ligne)
      : [...resultat, ajout];
  }, lignes);
}

function produitSnapshot(produit: Produit): LignePanier['produit'] {
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
