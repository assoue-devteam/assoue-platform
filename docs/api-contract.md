# Contrat d'API — AS'Soué

Référence entre le frontend Angular et le backend Spring Boot. Tenu à jour au fur et à mesure de l'implémentation — un endpoint qui diverge d'ici doit faire l'objet d'une mise à jour de ce fichier dans la même PR.

Toutes les routes sont préfixées par `/api`. Sauf mention contraire, les corps de requête/réponse sont en JSON.

## Auth

### `POST /api/auth/register`

Requête :
```json
{ "email": "client@example.com", "motDePasse": "au moins 8 caractères", "nom": "Ouédraogo", "prenom": "Awa" }
```

Réponse `201` :
```json
{ "token": "<JWT>", "email": "client@example.com", "roles": ["CLIENT"] }
```

Erreurs : `409` si l'email existe déjà, `400` si validation échoue (email invalide, mot de passe trop court).

### `POST /api/auth/login`

Requête : `{ "email": "...", "motDePasse": "..." }`

Réponse `200` : même forme que `register`.

Erreurs : `401` identifiants invalides, `423` compte bloqué après 3 échecs consécutifs (NFR sécurité du CDC).

Toutes les routes protégées attendent `Authorization: Bearer <token>`.

### `GET /api/utilisateurs`
Rôle ADMIN. Réponse `200` :
```json
[{ "id": 1, "email": "collecteur@example.com", "nom": "Sawadogo", "prenom": "Issa", "verrouille": false, "roles": ["COLLECTEUR"] }]
```
`verrouille` vaut `true` à partir de 3 échecs de connexion consécutifs.

### `POST /api/utilisateurs`
Rôle ADMIN. Seul chemin pour créer un compte COLLECTEUR ou ADMIN — `POST /api/auth/register` donne toujours CLIENT.
```json
{ "email": "collecteur@example.com", "motDePasse": "au moins 8 caractères", "nom": "Sawadogo", "prenom": "Issa", "roles": ["COLLECTEUR"] }
```
Réponse `201` : même format que la liste. Erreurs : `409` email déjà utilisé, `400` rôle inconnu ou validation échouée.

### `PUT /api/utilisateurs/{id}/roles`
Rôle ADMIN. Requête : `{ "roles": ["COLLECTEUR"] }` — remplace l'ensemble des rôles. `404` utilisateur introuvable, `400` rôle inconnu.

## Commerce

### `GET /api/categories`
Public. Réponse `200` : `[{ "id": 1, "nom": "Mobilier", "description": "..." }]`

### `GET /api/produits?categorieId=`
Public. `categorieId` optionnel. Réponse `200` :
```json
[{ "id": 1, "nom": "Chaise en pneu recyclé", "description": "...", "prix": 15000, "categorie": "Mobilier", "enRupture": false }]
```

### `GET /api/produits/{id}`
Public. Réponse `200` : un objet au même format qu'un élément de la liste ci-dessus. `404` si introuvable.

### `POST /api/commandes`
Authentifié (rôle CLIENT). Requête :
```json
{ "lignes": [{ "produitId": 1, "quantite": 2 }] }
```
Réponse `201` :
```json
{ "id": 10, "statut": "EN_ATTENTE_PAIEMENT", "dateCreation": "...", "total": 30000, "lignes": [{ "produitId": 1, "produitNom": "...", "quantite": 2, "prixUnitaire": 15000 }] }
```
Erreurs : `400` produit en rupture ou requête sans ligne, `404` produit introuvable.

### `GET /api/commandes/en-attente?heures=24`
Rôle ADMIN (MG-05). Commandes restées au statut `EN_ATTENTE_PAIEMENT` au-delà du délai indiqué (24 h par défaut), les plus anciennes d'abord. Réponse `200` :
```json
[{ "id": 10, "clientEmail": "client@example.com", "dateCreation": "...", "heuresDAttente": 30, "total": 30000 }]
```
Pas de notification poussée tant que l'infra temps réel (US-04) n'existe pas : le manager interroge cet endpoint.

### `GET /api/commandes/{id}`
Authentifié, uniquement le client propriétaire de la commande. Réponse `200` au même format que la création. `404` si introuvable ou n'appartient pas à l'appelant (pour ne pas révéler l'existence d'une commande d'un tiers).

## Paiement

### `POST /api/paiements/commandes/{commandeId}`
Authentifié. Initie le paiement PayDunya pour la commande. Réponse `200` :
```json
{ "commandeId": 10, "montant": 30000, "statut": "EN_ATTENTE", "urlPaiement": "https://paydunya.com/checkout/invoice/<token>" }
```
Le frontend redirige le client vers `urlPaiement`.

### `POST /api/paiements/webhook`
Public (appelé par PayDunya, pas par le frontend). Le backend ne fait jamais confiance au contenu du webhook : il revérifie le statut réel auprès de PayDunya avant de valider la commande (US-02). Réponse `200` vide dans tous les cas côté PayDunya ; le statut réel de la commande se consulte via `GET /api/commandes/{id}`.

**À vérifier avant mise en prod** : la forme exacte du payload webhook et de l'API confirm PayDunya n'a pas été testée contre un compte marchand réel — voir le commentaire dans `PaydunyaClient.java`.

## Collecte

### `POST /api/collectes`
Authentifié (rôle COLLECTEUR). Requête :
```json
{
  "referenceClient": "<UUID généré côté frontend, ex. IndexedDB>",
  "materiauId": 1,
  "quantiteEstimee": 15.5,
  "localisation": { "lat": 12.3714, "lng": -1.5197 }
}
```
`referenceClient` est la clé d'idempotence pour la synchronisation offline (US-03) : si elle a déjà été synchronisée, l'endpoint renvoie la déclaration existante au lieu d'en créer une seconde.

Réponse `201` :
```json
{ "id": 5, "referenceClient": "...", "statut": "DECLAREE", "dateDeclaration": "...", "latitude": 12.3714, "longitude": -1.5197, "lignes": [{ "materiau": "Plastique", "quantiteEstimee": 15.5 }] }
```

### `PUT /api/collectes/{id}`
Authentifié (rôle COLLECTEUR), uniquement le collecteur qui a saisi la déclaration. Corrige une saisie terrain (COL-03) :
```json
{ "materiauId": 2, "quantiteEstimee": 20.5, "localisation": { "lat": 12.3714, "lng": -1.5197 } }
```
`referenceClient` n'est pas modifiable. Réponse `200` au même format que la déclaration. Erreurs : `400` si la collecte n'est plus au statut `DECLAREE`, `404` si elle est introuvable ou appartient à un autre collecteur.

### `GET /api/collectes/mes-collectes`
Authentifié (rôle COLLECTEUR). Liste les déclarations du collecteur connecté, même format que ci-dessus.

### `GET /api/collectes?collecteurId=&statut=`
Rôle ADMIN (vue manager, MG-04). Les deux filtres sont optionnels ; `statut` vaut `DECLAREE`, `VALIDEE` ou `TRAITEE`. Réponse `200` :
```json
[{ "id": 5, "collecteurId": 3, "collecteurEmail": "collecteur@example.com", "statut": "TRAITEE", "dateDeclaration": "...", "latitude": 12.3714, "longitude": -1.5197, "lignes": [{ "materiau": "Plastique", "quantiteEstimee": 15.5 }] }]
```

### `GET /api/collectes/volumes`
Rôle ADMIN. Volumes cumulés par collecteur et par matériau (MG-04). Réponse `200` :
```json
[{ "collecteurId": 3, "collecteurEmail": "collecteur@example.com", "materiau": "Plastique", "quantiteTotale": 42.5, "nombreDeclarations": 4 }]
```

### `PUT /api/collectes/{id}/valider`
Authentifié (rôle ADMIN). Passe une déclaration `DECLAREE` en statut `VALIDEE`. `400` si elle est déjà validée ou traitée.

### `PUT /api/collectes/{id}/traiter`
Authentifié (rôle ADMIN). Passe une collecte `VALIDEE` en `TRAITEE` et incrémente le stock de matière première correspondant (US-05). `400` si la collecte n'est pas encore validée.

## Stock

Toutes les routes ci-dessous sont réservées au rôle ADMIN.

### `GET /api/stocks/produits`
Réponse `200` : `[{ "produitId": 1, "produitNom": "...", "quantite": 12 }]`

### `GET /api/stocks/matieres-premieres`
Réponse `200` : `[{ "materiauId": 1, "materiauNom": "Plastique", "quantite": 42.5 }]`

### `PUT /api/stocks/produits/{produitId}`
Requête : `{ "quantite": 20 }`. Ajuste manuellement le stock d'un produit fini.

## Codes d'erreur communs

Toute erreur renvoie :
```json
{ "horodatage": "2026-01-01T12:00:00Z", "statut": 404, "message": "..." }
```
`400` requête invalide, `401` non authentifié / identifiants invalides, `404` ressource introuvable, `409` conflit (ex. email déjà utilisé), `423` compte bloqué.

## Ce qui n'est pas encore couvert

- **US-04 (Should Have)** : pas de notification temps réel sur le changement de statut de commande — l'infra de notification (WebSocket/push) n'existe pas encore dans ce lot. Le frontend peut pour l'instant faire du polling sur `GET /api/commandes/{id}`.
- **Création de produits/catégories côté admin** : pas d'endpoint `POST`/`PUT` sur `/api/produits` ou `/api/categories` dans ce lot — à ajouter si le besoin d'admin apparaît avant la fin de la livraison.
- **Déclaration de Depot par un fournisseur** : pas d'endpoint dédié — le lien `Collecte.depot` existe en base mais rien ne le renseigne encore côté API.
