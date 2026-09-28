import { retourSecurise } from './connexion-page.component';

describe('retour après authentification', () => {
  it('conserve une route interne et rejette une redirection externe', () => {
    expect(retourSecurise('/panier', '/')).toBe('/panier');
    expect(retourSecurise('//site-externe.example', '/')).toBe('/');
    expect(retourSecurise('https://site-externe.example', '/')).toBe('/');
  });
});
