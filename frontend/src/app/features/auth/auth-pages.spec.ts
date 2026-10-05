import { HttpErrorResponse } from '@angular/common/http';
import { estCompteBloque, messageErreurConnexion, retourSecurise } from './connexion-page.component';
import { champErreurInscription } from './inscription-page.component';

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

describe('erreurs de connexion', () => {
  const http = (statut: number) => new HttpErrorResponse({ status: statut });

  it('401 : message vague qui ne révèle pas si l\u2019email existe', () => {
    expect(messageErreurConnexion(http(401))).toBe('Email ou mot de passe incorrect.');
  });

  it('423 : compte bloqué détecté, avec le contact AS\u2019SOUÉ', () => {
    expect(estCompteBloque(http(423))).toBeTrue();
    expect(estCompteBloque(http(401))).toBeFalse();
    expect(messageErreurConnexion(http(423))).toContain('+226 72 48 00 02');
  });

  it('panne réseau et 5xx : message générique (le formulaire reste rempli pour réessayer)', () => {
    expect(messageErreurConnexion(new HttpErrorResponse({ status: 0 }))).toContain('Pas de connexion');
    expect(messageErreurConnexion(http(500))).toContain('Réessayez');
  });
});

describe('rattachement des erreurs d\u2019inscription (GAP-11)', () => {
  it('409 : toujours sur le champ email', () => {
    expect(champErreurInscription(409, "Un compte existe déjà avec l'email x@y.z")).toBe('email');
  });

  it('400 : mot de passe trop court sur le champ mot de passe', () => {
    expect(champErreurInscription(400, 'Le mot de passe doit contenir au moins 8 caractères')).toBe('motDePasse');
  });

  it('400 : email invalide sur le champ email, le reste en alerte haute', () => {
    expect(champErreurInscription(400, 'doit être une adresse e-mail bien formée')).toBe('email');
    expect(champErreurInscription(400, 'quelque chose d\u2019inattendu')).toBeNull();
    expect(champErreurInscription(500, 'NullPointerException')).toBeNull();
  });
});
