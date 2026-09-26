import { statutAffiche } from './statuts';

describe('statutAffiche', () => {
  it('traduit les enums backend en libellé, ton et icône', () => {
    expect(statutAffiche('EN_ATTENTE_PAIEMENT')).toEqual({ libelle: 'En attente de paiement', ton: 'warning', icone: 'clock' });
    expect(statutAffiche('TRAITEE').libelle).toBe('Traitée');
  });

  it('reste lisible pour un statut inconnu', () => {
    expect(statutAffiche('NOUVEAU_STATUT')).toEqual({ libelle: 'NOUVEAU_STATUT', ton: 'neutre', icone: 'info' });
  });
});
