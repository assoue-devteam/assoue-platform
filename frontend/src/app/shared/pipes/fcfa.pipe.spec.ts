import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { FcfaPipe } from './fcfa.pipe';

describe('FcfaPipe', () => {
  const pipe = new FcfaPipe();
  beforeAll(() => registerLocaleData(localeFr));

  it('sépare les milliers et ajoute FCFA avec des espaces insécables', () => {
    // Séparateur de milliers fr = espace fine insécable (U+202F).
    expect(pipe.transform(15000)).toBe('15 000 FCFA');
  });

  it('renvoie une chaîne vide sans montant', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
