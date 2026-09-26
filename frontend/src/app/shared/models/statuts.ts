import { IconName } from '../ui/icon/icons';

export type Ton = 'neutre' | 'success' | 'warning' | 'error' | 'info';

export interface StatutAffiche {
  libelle: string;
  ton: Ton;
  icone: IconName;
}

// Libellés du design system §4 — les clés sont les valeurs exactes des enums backend.
export const STATUTS = {
  // CommandeStatut
  EN_ATTENTE_PAIEMENT: { libelle: 'En attente de paiement', ton: 'warning', icone: 'clock' },
  PAYEE: { libelle: 'Payée', ton: 'success', icone: 'check' },
  EN_PREPARATION: { libelle: 'En préparation', ton: 'info', icone: 'package' },
  EXPEDIEE: { libelle: 'Expédiée', ton: 'info', icone: 'truck' },
  LIVREE: { libelle: 'Livrée', ton: 'success', icone: 'check' },
  ANNULEE: { libelle: 'Annulée', ton: 'neutre', icone: 'x' },

  // PaiementStatut (Gestion uniquement)
  EN_ATTENTE: { libelle: 'En attente', ton: 'warning', icone: 'clock' },
  CONFIRME: { libelle: 'Confirmé', ton: 'success', icone: 'check' },
  ECHOUE: { libelle: 'Échoué', ton: 'error', icone: 'alert-circle' },

  // CollecteStatut
  DECLAREE: { libelle: 'Déclarée', ton: 'neutre', icone: 'pencil' },
  VALIDEE: { libelle: 'Validée', ton: 'info', icone: 'lock' },
  TRAITEE: { libelle: 'Traitée', ton: 'success', icone: 'check' },

  // États locaux de la file hors ligne du collecteur
  LOCALE: { libelle: 'Sur le téléphone', ton: 'warning', icone: 'smartphone' },
  ENVOI: { libelle: 'Envoi…', ton: 'neutre', icone: 'loader' },
  ECHEC_ENVOI: { libelle: "Échec d'envoi", ton: 'error', icone: 'alert-circle' },

  // Marqueurs sans enum backend
  RUPTURE: { libelle: 'Rupture de stock', ton: 'neutre', icone: 'x' },
  VERROUILLE: { libelle: 'Bloqué', ton: 'error', icone: 'lock' },
  ECART_WEBHOOK: { libelle: 'Écart', ton: 'error', icone: 'alert-circle' },
} satisfies Record<string, StatutAffiche>;

export type CodeStatut = keyof typeof STATUTS;

export function statutAffiche(code: string): StatutAffiche {
  // Un statut inconnu reste lisible plutôt que de casser l'écran (enum backend qui évolue).
  return (STATUTS as Record<string, StatutAffiche>)[code] ?? { libelle: code, ton: 'neutre', icone: 'info' };
}
