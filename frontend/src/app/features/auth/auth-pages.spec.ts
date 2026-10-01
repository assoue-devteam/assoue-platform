import { retourSecurise } from './connexion-page.component';

describe('retour après authentification', () => {
  it('conserve une route interne et rejette une redirection externe', () => {
    expect(retourSecurise('/panier', '/')).toBe('/panier');
    expect(retourSecurise('//site-externe.example', '/')).toBe('/');
    expect(retourSecurise('https://site-externe.example', '/')).toBe('/');
  });

  it('ne redirige jamais vers les pages d\u2019auth elles-mêmes (boucle + chargement infini)', () => {
    expect(retourSecurise('/connexion', '/')).toBe('/');
    expect(retourSecurise('/connexion?retour=%2Fcommandes&raison=expiree', '/collecte')).toBe('/collecte');
    expect(retourSecurise('/inscription', '/')).toBe('/');
    expect(retourSecurise('/inscription?retour=%2Fpanier', '/')).toBe('/');
    expect(retourSecurise('/commandes?statut=EN_ATTENTE_PAIEMENT', '/')).toBe('/commandes?statut=EN_ATTENTE_PAIEMENT');
  });
});
