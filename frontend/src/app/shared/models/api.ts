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
