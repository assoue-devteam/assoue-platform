import { Injectable, computed, signal } from '@angular/core';
import { Produit } from '../../shared/models/api';

export interface LignePanier {
  produit: Pick<Produit, 'id' | 'nom' | 'prix' | 'imageUrl' | 'categorie' | 'enRupture'>;
  quantite: number;
}

const CLE_PANIER = 'assoue.panier';

@Injectable({ providedIn: 'root' })
export class PanierService {
  readonly lignes = signal<LignePanier[]>(lirePanier());
  readonly nombreArticles = computed(() => this.lignes().reduce((total, ligne) => total + ligne.quantite, 0));
  readonly total = computed(() => this.lignes().reduce((total, ligne) => total + ligne.produit.prix * ligne.quantite, 0));

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
    localStorage.setItem(CLE_PANIER, JSON.stringify(prochain));
  }
}

function produitSnapshot(produit: Produit): LignePanier['produit'] {
  const { id, nom, prix, imageUrl, categorie, enRupture } = produit;
  return { id, nom, prix, imageUrl, categorie, enRupture };
}

function lirePanier(): LignePanier[] {
  try {
    const valeur = JSON.parse(localStorage.getItem(CLE_PANIER) ?? '[]') as unknown;
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
