import { IconName } from '../../shared/ui/icon/icons';

// Données de la page « Notre impact » : plaquette AS'SOUÉ 2026 (source affichée
// sous les chiffres). Aucun endpoint ne les fournit (l'API communauté porte
// d'autres chiffres, saisis par l'admin) : valeurs écrites ici, jamais dans le template.
// Textes repris à l'identique : seule la présentation change.

export interface ChiffreImpact {
  valeur: number;
  libelle: string;
  /** Ce que mesure le chiffre, sans promesse au-delà de la plaquette. */
  contexte: string;
}

export interface CarteMission {
  icone: IconName;
  titre: string;
  texte: string;
}

export interface ValeurAssoue {
  titre: string;
  texte: string;
}

export interface Distinction {
  annee: number;
  titre: string;
}

export interface DonneesImpact {
  /** Année de création, pour le sur-titre fixe « Depuis 2018 au Burkina Faso ». */
  anneeCreation: number;
  source: string;
  regions: string[];
  chiffres: ChiffreImpact[];
  mission: CarteMission[];
  valeurs: ValeurAssoue[];
  distinctions: Distinction[];
}

export const DONNEES_IMPACT: DonneesImpact = {
  anneeCreation: 2018,
  source: "plaquette AS'SOUÉ 2026",
  regions: ['Centre', 'Centre-Nord', 'Hauts-Bassins', 'Est', 'Centre-Est'],
  chiffres: [
    { valeur: 400670, libelle: 'pneus recyclés', contexte: 'Pneus usagés collectés et transformés en objets utiles.' },
    { valeur: 801, libelle: 'emplois directs', contexte: 'Artisans salariés dans les ateliers.' },
    { valeur: 1857, libelle: 'emplois indirects', contexte: 'Activités générées en amont et en aval.' },
  ],
  mission: [
    { icone: 'recycle', titre: 'Réduire la pollution', texte: 'Chaque pneu collecté quitte un caniveau ou un terrain vague de nos quartiers pour devenir un objet utile.' },
    { icone: 'shield-check', titre: 'Protéger la santé', texte: "Les pneus abandonnés retiennent l'eau de pluie et deviennent des gîtes à moustiques porteurs du paludisme." },
    { icone: 'users', titre: 'Créer des emplois', texte: "Nos artisans, en majorité des femmes et des jeunes formés dans nos ateliers, vivent de ce qu'ils fabriquent." },
  ],
  valeurs: [
    { titre: 'Écoresponsabilité', texte: 'Produire sans détruire.' },
    { titre: "Partage de l'expertise", texte: 'Transmettre pour grandir ensemble.' },
    { titre: 'Intégration', texte: 'Ne laisser personne de côté.' },
    { titre: 'Résilience', texte: "Transformer l'obstacle en opportunité." },
  ],
  distinctions: [
    { annee: 2022, titre: "Prix de l'entrepreneuriat innovant (OFEQ)" },
    { annee: 2023, titre: "Ambassadrice de l'environnement (Burkina) et de la Paix (Religion for Peace)" },
    { annee: 2024, titre: '1er Prix national Tremplin UEMOA' },
    { annee: 2025, titre: 'Prix féminin national au POESAM' },
  ],
};

/** Sur-titre fixe : valeur de la plaquette, pas un calcul d'âge qui vieillit. */
export const SURTITRE_IMPACT = `Depuis ${DONNEES_IMPACT.anneeCreation} au Burkina Faso`;
