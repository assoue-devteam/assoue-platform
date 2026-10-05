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

### `GET /api/utilisateurs?verrouilles=`
Rôle ADMIN. `verrouilles` est optionnel : `true` ne renvoie que les comptes bloqués par le compteur d'échecs (SA-02), `false` que les comptes actifs. Réponse `200` :
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

### `POST /api/utilisateurs/{id}/debloquer`
Rôle ADMIN (SA-02). Remet le compteur d'échecs à zéro : le compte verrouillé après 3 échecs peut de nouveau se connecter. Sans corps de requête. Réponse `200` : l'utilisateur au format ci-dessus, avec `verrouille: false`. `404` utilisateur introuvable.

## Commerce

### `GET /api/categories`
Public. Réponse `200` : `[{ "id": 1, "nom": "Mobilier", "description": "..." }]`

### `GET /api/produits?categorieId=`
Public. `categorieId` optionnel. Réponse `200` :
```json
[{ "id": 1, "nom": "Chaise en pneu recyclé", "description": "...", "prix": 15000, "imageUrl": "https://.../chaise.jpg", "categorie": "Mobilier", "enRupture": false }]
```
`imageUrl` peut être `null` (CL-03, migration V9). Aucun endpoint ne permet encore de le renseigner.

### `GET /api/produits/{id}`
Public. Réponse `200` : un objet au même format qu'un élément de la liste ci-dessus. `404` si introuvable ou archivé (un produit archivé est introuvable partout côté public, comme s'il n'existait pas).

### `POST /api/produits`
Rôle ADMIN. Crée un produit du catalogue avec son stock initial. Requête :
```json
{ "nom": "Tabouret en pneu", "categorieId": 1, "prix": 12000, "description": "...", "imageUrl": "https://.../tabouret.jpg", "stockQuantite": 5, "vedette": false }
```
`nom` (non vide, 200 car. max), `categorieId` (existante) et `prix` (entier FCFA ≥ 0, jamais de float ; `0` accepté) sont obligatoires. `description` (2000 car. max), `imageUrl` (optionnel, `http(s)://` uniquement, même règle que les événements — pas d'upload), `stockQuantite` (optionnel, ≥ 0 ; absent = `0`, donc en rupture) et `vedette` (optionnel, défaut `false`) sont facultatifs. `enRupture` n'est jamais saisi : il est dérivé du stock (`0` ou ligne absente → en rupture).
Réponse `201` au format produit. Erreurs : `400` validation, `404` catégorie inconnue.

### `PUT /api/produits/{id}`
Rôle ADMIN. Remplace les champs du produit ; `stockQuantite` présent **remplace** le stock (absent = inchangé) — pas d'endpoint dédié, un seul appel suffit. Réponse `200` au format produit. Erreurs : `400` validation, `404` produit introuvable, archivé ou catégorie inconnue.

### `DELETE /api/produits/{id}`
Rôle ADMIN. Suppression toujours logique (archivage, jamais de `409`, jamais de suppression physique) : le produit disparaît du catalogue mais reste lisible dans l'historique des commandes, favoris et paniers qui le référencent. Réponse `204`. `404` si introuvable ou déjà archivé.

Un produit archivé est refusé comme un produit en rupture : `PUT /api/panier` et `POST /api/commandes` renvoient `400` (« « \<nom\> » n'est plus disponible »).

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

Statuts de commande (`CommandeStatut`) : `EN_ATTENTE_PAIEMENT`, `PAYEE`, `EN_PREPARATION`, `EXPEDIEE`, `LIVREE`, `ANNULEE`. Seule la transition `EN_ATTENTE_PAIEMENT → PAYEE` (webhook revalidé) est implémentée : aucun endpoint ne fait passer une commande aux statuts suivants.

### `GET /api/commandes/mes-commandes`
Rôle CLIENT (CL-05). Commandes du client connecté, les plus récentes d'abord. Réponse `200` : liste au même format que la création.

### `GET /api/commandes?statut=`
Rôle ADMIN (vue manager, MG-02). `statut` est optionnel (une valeur de `CommandeStatut` ; en pratique `EN_ATTENTE_PAIEMENT` ou `PAYEE`), les plus récentes d'abord. Réponse `200` :
```json
[{ "id": 10, "clientEmail": "client@example.com", "statut": "PAYEE", "dateCreation": "...", "total": 30000, "lignes": [{ "produitId": 1, "produitNom": "...", "quantite": 2, "prixUnitaire": 15000 }] }]
```

### `GET /api/commandes/en-attente?heures=24`
Rôle ADMIN (MG-05). Commandes restées au statut `EN_ATTENTE_PAIEMENT` au-delà du délai indiqué (24 h par défaut), les plus anciennes d'abord. Réponse `200` :
```json
[{ "id": 10, "clientEmail": "client@example.com", "dateCreation": "...", "heuresDAttente": 30, "total": 30000 }]
```
Pas de notification poussée tant que l'infra temps réel (US-04) n'existe pas : le manager interroge cet endpoint.

### `GET /api/commandes/{id}`
Authentifié (rôle CLIENT ou ADMIN). Le client n'accède qu'à ses propres commandes ; le manager (rôle ADMIN) accède à n'importe laquelle pour en connaître le statut réel sans dépendre du webhook (MG-02). Réponse `200` au même format que la création. `404` si introuvable ou, pour un client, si elle n'est pas la sienne (pour ne pas révéler l'existence d'une commande d'un tiers).

### `GET /api/panier`
Rôle CLIENT (CL-02 : retrouver son panier à la connexion, sur tout appareil). Panier du client connecté, avec les infos produit **à jour** (prix actuel, `enRupture`) — le prix n'est jamais repris d'une valeur gardée côté navigateur. Réponse `200` (panier vide : `{ "lignes": [], "total": 0 }`) :
```json
{ "lignes": [{ "produit": { "id": 4, "nom": "...", "description": "...", "prix": 25000, "imageUrl": null, "categorie": "Mobilier", "enRupture": false }, "quantite": 2 }], "total": 50000 }
```

### `PUT /api/panier`
Rôle CLIENT. Remplace **tout** le panier par le contenu envoyé (rejouable sans risque après une coupure réseau) ; `lignes: []` le vide. Deux lignes du même produit sont additionnées. Requête :
```json
{ "lignes": [{ "produitId": 4, "quantite": 2 }] }
```
Réponse `200` au format de `GET /api/panier`. Le stock disponible est vérifié dès cet appel, mais **rien n'est réservé** : la réservation n'a lieu qu'à `POST /api/commandes`. Erreurs (le panier existant reste alors inchangé) : `400` quantité < 1 ou supérieure au stock disponible (message : `Stock insuffisant pour « <nom> » : <n> disponible(s)`), `404` produit introuvable.

### `PUT /api/produits/{id}/vedette`
Rôle ADMIN. Met un produit en avant (ou le retire) en tête du catalogue. Requête : `{ "vedette": true }`. Réponse `200` au format produit. `404` produit introuvable. Tous les formats produit portent désormais `vedette` (booléen).

### `GET /api/produits/{id}/avis`
Public. Réponse `200` : `{ "moyenne": 4.5, "nombre": 2, "avis": [{ "note": 5, "commentaire": "...", "auteur": "Awa O.", "date": "..." }] }` (`moyenne` à `null` sans avis ; les plus récents d'abord ; l'auteur est le prénom et l'initiale du nom, jamais l'email). `404` produit introuvable. Tous les formats produit portent désormais `noteMoyenne` (ou `null`) et `nombreAvis`.

### `GET /api/produits/{id}/avis/moi`
Rôle CLIENT. Réponse `200` : `{ "peutDonnerAvis": true, "monAvis": null }`. `peutDonnerAvis` est vrai si le client a une commande `PAYEE`, `EN_PREPARATION`, `EXPEDIEE` ou `LIVREE` contenant ce produit.

### `PUT /api/produits/{id}/avis`
Rôle CLIENT. Crée l'avis du client ou remplace le sien (un seul par client et par produit). Requête : `{ "note": 4, "commentaire": "..." }` (note 1 à 5, commentaire facultatif, 1000 caractères au plus). Réponse `200` au format d'un avis. Erreurs : `400` note invalide ou client sans achat payé de ce produit (« Vous pourrez donner votre avis après avoir acheté et payé ce produit. »), `404` produit introuvable.

### `GET /api/favoris`
Rôle CLIENT. Produits mis en favori par le client connecté, du plus récent au plus ancien, au format de `GET /api/produits/{id}` (prix et `enRupture` à jour). Réponse `200` : liste, vide si aucun favori.

### `PUT /api/favoris/{produitId}` · `DELETE /api/favoris/{produitId}`
Rôle CLIENT. Ajoute ou retire un produit des favoris. Les deux sont idempotents (ajouter deux fois ou retirer un produit absent ne change rien). Réponse `204`. Erreur : `404` produit introuvable (ajout).

## Paiement

### `POST /api/paiements/commandes/{commandeId}`
Rôle CLIENT, propriétaire de la commande uniquement (`404` sinon, comme pour `GET /api/commandes/{id}`). Initie le paiement PayDunya pour la commande. `400` si la commande est `PAYEE` ou `ANNULEE`. Si un paiement existe déjà et que son invoice PayDunya est encore ouverte, le même lien est renvoyé ; sinon une nouvelle invoice est créée. Réponse `200` :
```json
{ "commandeId": 10, "montant": 30000, "statut": "EN_ATTENTE", "urlPaiement": "https://paydunya.com/checkout/invoice/<token>" }
```
Le frontend redirige le client vers `urlPaiement`.

### `POST /api/paiements/webhook`
Public (appelé par PayDunya, pas par le frontend). Le backend ne fait jamais confiance au contenu du webhook : il revérifie le statut réel auprès de PayDunya avant de valider la commande (US-02, SA-06). Il conserve le statut annoncé par le webhook et la date de réception pour permettre l'audit et la détection d'écarts. Réponse `200` vide dans tous les cas côté PayDunya ; le statut réel de la commande se consulte via `GET /api/commandes/{id}`.

**À vérifier avant mise en prod** : la forme exacte du payload webhook et de l'API confirm PayDunya n'a pas été testée contre un compte marchand réel — voir le commentaire dans `PaydunyaClient.java`.

### `GET /api/paiements`
Rôle ADMIN (supervision super admin, SA-06). Liste tous les paiements avec comparaison entre le statut réel revalidé et le statut annoncé par le webhook PayDunya. Les plus récents d'abord. Réponse `200` :
```json
[
  {
    "id": 1,
    "commandeId": 10,
    "clientEmail": "client@example.com",
    "montant": 30000,
    "statut": "CONFIRME",
    "statutCommande": "PAYEE",
    "tokenPaydunya": "invoice_token_123",
    "statutAnnonceWebhook": "completed",
    "dateDernierWebhook": "2026-09-24T14:30:00",
    "dateCreation": "2026-09-24T14:25:00",
    "dateConfirmation": "2026-09-24T14:30:05",
    "ecartWebhook": false
  }
]
```
`ecartWebhook` vaut `true` si un webhook a été reçu (`statutAnnonceWebhook != null`) mais que la revalidation n'a pas confirmé le paiement (`statut != CONFIRME`), signalant une anomalie ou tentative de fraude.

## Communauté

Lecture publique (`GET` ouvert dans `SecurityConfig`), écriture réservée à l'ADMIN.

### `GET /api/evenements`
Public. Tous les événements, du plus ancien au plus récent (le frontend sépare « à venir » et « passés »). Réponse `200` : `[{ "id": 1, "titre": "...", "dateDebut": "2026-12-15T09:00:00", "lieu": "...", "description": null, "imageUrl": null, "placesRestantes": 15 }]`. `placesRestantes` est une information saisie par l'admin, pas un compteur d'inscriptions (aucune inscription n'est gérée : « Participer » ouvre WhatsApp).

### `POST /api/evenements` · `PUT /api/evenements/{id}` · `DELETE /api/evenements/{id}`
Rôle ADMIN. Requête : `{ "titre", "dateDebut", "lieu", "description"?, "imageUrl"?, "placesRestantes"? }` (titre 150 car., lieu 200, description 2000, `imageUrl` en `http(s)://` uniquement, places >= 0). Réponses : `201` (création), `200` (modification), `204` (suppression). Erreurs : `400` validation, `404` événement introuvable.

### `GET /api/communaute/chiffres` · `PUT /api/communaute/chiffres`
`GET` public : `[{ "libelle": "Artisans soutenus", "valeur": 245 }]`, dans l'ordre d'affichage, vide tant que l'admin n'a rien saisi. `PUT` (ADMIN) remplace toute la liste : `{ "chiffres": [{ "libelle", "valeur" }] }`, 6 au plus, libellé 80 car., valeur >= 0.

## Images (upload admin, lot 8)

Les formulaires admin n'exposent plus que l'upload (`app-image-upload`) ; les anciennes `imageUrl` en `https` restent affichées telles quelles (aucune migration de données).

### `POST /api/images`
Rôle ADMIN, `multipart/form-data` avec le champ `fichier`. Le serveur vérifie le type réel par magic bytes (JPEG et PNG uniquement — pas de WebP, ImageIO ne le lit pas sans plugin), les dimensions avant décodage (4000 × 4000 et 12 M pixels au plus, anti bombe de décompression), décode puis **réencode** l'image (supprime EXIF/GPS et contenus annexes). Réponse `201` : `{ "cle": "<uuid>.jpg" }` — la clé, jamais un chemin disque ni le nom client. Le nom d'origine n'est jamais utilisé pour stocker.
Erreurs : `400` fichier vide/illisible ou clé inconnue dans un formulaire, `413` au-delà de 5 Mo (« L'image dépasse 5 Mo »), `415` format interdit ou contenu non image, `403` sans token (comme tous les endpoints protégés, pas d'`AuthenticationEntryPoint` dédié) ou avec un mauvais rôle.

### `GET /api/images/{cle}`
Public. `{cle}` validée par regex stricte (UUID + `.jpg`/`.png`, sinon 404) ; `../`, séparateurs encodés et clés inconnues → 4xx sans accès fichier. `Content-Type` fixé par le serveur, `Cache-Control: public, max-age=31536000, immutable` (clé unique), `X-Content-Type-Options: nosniff` global.

### Champs `imageCle` (produits et événements)
`POST/PUT /api/produits` et `POST/PUT /api/evenements` acceptent `imageCle` (clé renvoyée par l'upload, doit exister sinon `400`) en plus de `imageUrl` (legacy `http(s)`, même validateur qu'avant). **Si les deux arrivent ensemble, `imageCle` l'emporte** et `imageUrl` est vidée. Les réponses portent `imageCle` (ou `null`) et `imageUrl` **résolue** : URL legacy telle quelle, sinon `/api/images/{cle}`, sinon `null` — le front n'a rien changé à son affichage. Côté front, `/api/images/...` passe par le proxy en dev et la même origine en prod ; si un jour front et API sont sur des origines différentes, le helper `resoudreUrlImage` préfixe avec l'origine de `apiUrl` (absolue).
Remplacement d'image ou suppression d'événement (physique) : l'ancien fichier est supprimé après commit. Archivage produit (suppression logique) : le fichier est gardé (commandes, paniers et favoris pointent le produit vivant, aucune copie d'image n'est stockée dans l'historique). Un upload jamais rattaché à un formulaire reste orphelin (nettoyage à prévoir, voir dette technique).

Stockage : interface `StockageImage`, implémentation disque, dossier `ASSOUE_IMAGES_DIR` (`./uploads` en dev, **absolu obligatoire en production**, échec clair au démarrage sinon — volume à monter, voir README). Disque éphémère = images perdues à chaque redéploiement : passer au stockage objet = 2e implémentation de l'interface, sans autre changement.

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
Requête : `{ "quantite": 20 }` (≥ 0, remplace la valeur). Ajuste manuellement le stock d'un produit fini. `404` si le produit n'a pas de ligne de stock. Verrou optimiste (`@Version`, migration V10) : en cas de modification concurrente, `409` (« La quantité a changé entre-temps. Rechargez la page. »).

## Codes d'erreur communs

Toute erreur renvoie :
```json
{ "horodatage": "2026-01-01T12:00:00Z", "statut": 404, "message": "..." }
```
`400` requête invalide, `401` identifiants invalides (login), `403` accès refusé, `404` ressource introuvable, `409` conflit (ex. email déjà utilisé), `423` compte bloqué.

`403` est renvoyé par Spring Security quand le rôle ne correspond pas (`@PreAuthorize`). Aucun `AuthenticationEntryPoint` n'est configuré : un appel sans token ou avec un token expiré renvoie probablement aussi `403` plutôt que `401`, et hors du format `ErreurApi` (à confirmer par un test). Le frontend doit donc détecter l'expiration de session en lisant `exp` dans le JWT.

## Ce qui n'est pas encore couvert

- **US-04 (Should Have)** : pas de notification temps réel sur le changement de statut de commande — l'infra de notification (WebSocket/push) n'existe pas encore dans ce lot. Le frontend peut pour l'instant faire du polling sur `GET /api/commandes/{id}`.
- **Catégories côté admin** : pas d'endpoint `POST` sur `/api/categories` — les quatre catégories (Mobilier, Bijoux, Chaussures, Accessoires) sont fournies par les données de départ, il n'y a pas de besoin réel.
- **Déclaration de Depot par un fournisseur** : pas d'endpoint dédié — le lien `Collecte.depot` existe en base mais rien ne le renseigne encore côté API.
