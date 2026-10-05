# features/auth/

Login, register, gestion de session côté frontend.

## « Se souvenir de moi » (front uniquement)

Le backend ne fournit ni refresh token ni durée de session paramétrable (GAP-07) :
la case à cocher ne change que l'emplacement du JWT, lu par `AuthService` :

- coché → `localStorage` (`assoue.session`, survit au redémarrage du navigateur) ;
- décoché → `sessionStorage` (vidé à la fermeture de l'onglet).

`tokenValide()` lit les deux emplacements, `deconnecter()` vide les deux, et chaque
connexion vide l'emplacement non choisi (une seule session à la fois).

Note sécurité : ce stockage expose le JWT au vol par XSS. En contrepartie, aucun HTML
d'origine serveur n'est injecté sans échappement (interpolation Angular uniquement,
jamais de `innerHTML` sur des données d'API). Le claim `exp` n'est lu côté front que
pour l'UX (déconnexion automatique) : le backend reste l'autorité.

## Spécificités

- Pas de « Mot de passe oublié » : aucun endpoint backend, donc aucun lien dans l'UI.
- Le 401/403 de `POST /api/auth/login` ne déclenche jamais la modale « session expirée »
  (l'intercepteur ignore `/api/auth/**`) : c'est une erreur métier, pas une expiration.
- `retourSecurise()` n'accepte qu'un chemin interne (anti open-redirect) et jamais une
  page d'auth (sinon boucle + bouton bloqué en chargement).
