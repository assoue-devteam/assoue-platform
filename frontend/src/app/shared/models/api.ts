// Formats JSON du backend (docs/api-contract.md). Noms de champs identiques aux records Java.

export type Role = 'CLIENT' | 'COLLECTEUR' | 'ADMIN';

export interface AuthResponse {
  token: string;
  email: string;
  roles: Role[];
}

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface RegisterRequest extends LoginRequest {
  nom?: string;
  prenom?: string;
}

export interface ErreurApi {
  horodatage: string;
  statut: number;
  message: string;
}

export interface Categorie {
  id: number;
  nom: string;
  description: string | null;
}

export interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  imageUrl: string | null;
  categorie: string;
  enRupture: boolean;
  vedette: boolean;
  noteMoyenne: number | null;
  nombreAvis: number;
}

export interface Avis {
  note: number;
  commentaire: string | null;
  auteur: string;
  date: string;
}

export interface AvisProduit {
  moyenne: number | null;
  nombre: number;
  avis: Avis[];
}

export interface MonAvis {
  peutDonnerAvis: boolean;
  monAvis: Avis | null;
}

export type CommandeStatut = 'EN_ATTENTE_PAIEMENT' | 'PAYEE' | 'EN_PREPARATION' | 'EXPEDIEE' | 'LIVREE' | 'ANNULEE';
export type PaiementStatut = 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE';

export interface LigneCommandeRequest {
  produitId: number;
  quantite: number;
}

export interface CommandeRequest {
  lignes: LigneCommandeRequest[];
}

export interface Panier {
  lignes: { produit: Produit; quantite: number }[];
  total: number;
}

export interface LigneCommande {
  produitId: number;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Commande {
  id: number;
  statut: CommandeStatut;
  dateCreation: string;
  total: number;
  lignes: LigneCommande[];
}

export interface PaiementResponse {
  commandeId: number;
  montant: number;
  statut: PaiementStatut;
  urlPaiement: string;
}

export type CollecteStatut = 'DECLAREE' | 'VALIDEE' | 'REJETEE' | 'TRAITEE';

export interface Materiau {
  id: number;
  nom: string;
  unite: string;
}

export interface Localisation {
  lat: number;
  lng: number;
}

export interface CollecteLigne {
  materiau: string;
  quantiteEstimee: number;
}

export interface Collecte {
  id: number;
  referenceClient: string;
  statut: CollecteStatut;
  dateDeclaration: string;
  latitude: number;
  longitude: number;
  lignes: CollecteLigne[];
}

export interface CollecteAdmin extends Collecte {
  collecteurId: number;
  collecteurEmail: string;
}

export interface DeclarationCollecteRequest {
  referenceClient: string;
  materiauId: number;
  quantiteEstimee: number;
  localisation: Localisation;
}

export interface VolumeCollecte {
  collecteurId: number;
  collecteurEmail: string;
  materiau: string;
  quantiteTotale: number;
  nombreDeclarations: number;
}

export interface CommandeAdmin {
  id: number;
  clientEmail: string;
  statut: CommandeStatut;
  dateCreation: string;
  total: number;
  lignes: LigneCommande[];
}

export interface CommandeEnAttente {
  id: number;
  clientEmail: string;
  dateCreation: string;
  heuresDAttente: number;
  total: number;
}

export interface StockProduit {
  produitId: number;
  produitNom: string;
  quantite: number;
}

export interface StockMatiere {
  materiauId: number;
  materiauNom: string;
  quantite: number;
}

export interface UtilisateurAdmin {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  verrouille: boolean;
  roles: Role[];
}
