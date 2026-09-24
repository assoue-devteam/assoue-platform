# Backlog AS'Soué — user stories par rôle

Converti depuis `MVP-Projet-AS'Soue-APP-corrige.xlsx` (source de vérité côté produit). Statuts déclarés par l'équipe, à vérifier contre le code réel avant toute implémentation.

Légende priorité MoSCoW : **M** Must have, **S** Should have, **C** Could have, **W** Won't have (ce sprint).

---

# État réel vérifié — audit du 23/09/2026

Statuts confrontés au code (backend Spring Boot + frontend Angular). Le frontend ne contient encore aucun écran : toute story marquée « livré » l'est **côté API uniquement**. Backlog gelé non audité.

| Story | Statut déclaré | État réel |
| --- | --- | --- |
| SA-01 | Terminé | Livré (403 par rôle + administration des comptes et des rôles, `GET/POST /api/utilisateurs`, `PUT /api/utilisateurs/{id}/roles`) |
| SA-02 | En cours | Livré — blocage au 3e échec (423) + `GET /api/utilisateurs?verrouilles=true` et `POST /api/utilisateurs/{id}/debloquer` |
| SA-03 | Terminé | Livré — la validation exige désormais le statut `DECLAREE` (une collecte traitée ne peut plus régresser) |
| SA-04 | Terminé | Livré |
| SA-05 | Terminé | Livré — logique encore dans `StockController` plutôt que dans `StockService` |
| SA-06 | En cours | Livré — revalidation obligatoire auprès de PayDunya, historique webhook et supervision `GET /api/paiements` (signalement des écarts) |
| MG-01 | Terminé | Livré côté API (pas d'écran) |
| MG-02 | En cours | Livré — `GET /api/commandes/{id}` ouvert au manager (ADMIN) sans dépendre du webhook, plus `GET /api/commandes?statut=` |
| MG-03 | Terminé | Livré côté API (rôle ADMIN) |
| MG-04 | À faire | Livré — `GET /api/collectes?collecteurId=&statut=` et `GET /api/collectes/volumes` |
| MG-05 | À faire | Livré côté API — `GET /api/commandes/en-attente?heures=24`, pas de notification poussée (US-04 absente) |
| COL-01 | À faire | Prérequis backend livré (compte COLLECTEUR créable) ; PWA et cache hors-ligne restent à faire |
| COL-02 | À faire | API de déclaration idempotente disponible ; saisie terrain et IndexedDB restent à faire |
| COL-03 | À faire | Livré — `PUT /api/collectes/{id}`, refusé si la déclaration n'est plus `DECLAREE` |
| COL-04 | À faire | API disponible (`GET /api/collectes/mes-collectes`) ; écran de suivi à faire |
| CL-01 | Terminé | API OK, dashboard client inexistant |
| CL-03 | Terminé | API OK, écran catalogue inexistant |
| CL-04 | En cours | API OK (initiation restreinte au client propriétaire), redirection front à faire, payload PayDunya non validé en réel |
| CL-05 | Terminé | API OK, écran de suivi inexistant |

---

# Backlog actif

## Super Admin

### SA-01 — Super Admin

**Story** : en tant que super admin, je veux gerer les roles et permissions des utilisateurs, afin que chaque profil (Manager, Formateur, Participant, Collecteur, Client) n'accede qu'aux fonctionnalites qui lui sont autorisees.

- **DoR** : Modele de roles defini (ADMIN, CLIENT, COLLECTEUR)
- **DoD** : Un utilisateur ne peut pas acceder aux endpoints reserves a un autre role (403 renvoye)
- **Priorité** : M · **Statut déclaré** : Termine

### SA-02 — Super Admin

**Story** : en tant que super admin, je veux consulter et debloquer les comptes verrouilles apres 3 echecs de connexion, afin de garantir la continuite d'acces tout en respectant l'exigence de securite du cahier des charges.

- **DoR** : Compteur d'echecs par utilisateur, code 423 renvoye apres 3 echecs
- **DoD** : Le compte est verrouille automatiquement au 3e echec et peut etre debloque par le super admin
- **Priorité** : M · **Statut déclaré** : En cours

### SA-03 — Super Admin

**Story** : en tant que super admin, je veux valider les declarations de collecte remontees par les collecteurs terrain, afin de m'assurer que seules les collectes verifiees alimentent le stock de matiere premiere.

- **DoR** : Declaration au statut DECLAREE, geolocalisation et materiau renseignes
- **DoD** : La declaration passe au statut VALIDEE et n'est plus modifiable par le collecteur
- **Priorité** : M · **Statut déclaré** : Termine

### SA-04 — Super Admin

**Story** : en tant que super admin, je veux transformer une collecte validee en entree de stock de matiere premiere, afin de piloter precisement les volumes de matiere disponible pour la production.

- **DoR** : Collecte au statut VALIDEE
- **DoD** : Le stock de matiere premiere correspondant est incremente automatiquement et la collecte passe au statut TRAITEE
- **Priorité** : M · **Statut déclaré** : Termine

### SA-05 — Super Admin

**Story** : en tant que super admin, je veux ajuster manuellement le stock des produits finis, afin de corriger les ecarts d'inventaire (casse, invendus, comptage physique).

- **DoR** : Acces reserve au role ADMIN, identifiant du produit concerne
- **DoD** : La quantite en stock est mise a jour et l'historique des commandes n'est pas affecte
- **Priorité** : S · **Statut déclaré** : Termine

### SA-06 — Super Admin

**Story** : en tant que super admin, je veux superviser les paiements PayDunya y compris les webhooks recus, afin de eviter toute fraude sur la validation des commandes.

- **DoR** : Webhook PayDunya recu, revalidation obligatoire du statut reel aupres de PayDunya avant de valider la commande
- **DoD** : Une commande n'est jamais validee sur la seule foi du contenu du webhook
- **Priorité** : M · **Statut déclaré** : En cours

## Manager

### MG-01 — Manager

**Story** : en tant que manager, je veux consulter le catalogue de produits et leur disponibilite, afin de anticiper les ruptures de stock et organiser la production.

- **DoR** : Categories et produits existants, champ enRupture disponible
- **DoD** : La liste des produits affiche clairement les articles en rupture
- **Priorité** : M · **Statut déclaré** : Termine

### MG-02 — Manager

**Story** : en tant que manager, je veux suivre les commandes clients et leur statut de paiement, afin de relancer les livraisons et signaler les anomalies de paiement.

- **DoR** : Commande liee a un client, statut EN_ATTENTE_PAIEMENT ou payee
- **DoD** : Le manager retrouve le statut reel d'une commande sans dependre du webhook (polling GET /api/commandes/{id})
- **Priorité** : M · **Statut déclaré** : En cours

### MG-03 — Manager

**Story** : en tant que manager, je veux consulter les stocks de matiere premiere issus de la collecte, afin de planifier les besoins en approvisionnement avec les collecteurs.

- **DoR** : Stock alimente par les collectes validees puis traitees
- **DoD** : La quantite par materiau reflete les dernieres collectes traitees
- **Priorité** : M · **Statut déclaré** : Termine

### MG-04 — Manager

**Story** : en tant que manager, je veux consulter les volumes de collecte par collecteur et par zone, afin de evaluer la performance du reseau de collecteurs terrain.

- **DoR** : Localisation (lat/lng) et materiau associes a chaque declaration
- **DoD** : Un export ou une vue liste des collectes par collecteur est disponible
- **Priorité** : M · **Statut déclaré** : A faire

### MG-05 — Manager

**Story** : en tant que manager, je veux etre alerte des commandes en attente de paiement depuis plus de 24h, afin de relancer les clients ou liberer les reservations de stock.

- **DoR** : Commande au statut EN_ATTENTE_PAIEMENT, horodatage de creation disponible
- **DoD** : Les commandes depassant 24h sans confirmation apparaissent dans une vue d'alerte dediee
- **Priorité** : M · **Statut déclaré** : A faire

## Collecteur

### COL-01 — Collecteur

**Story** : en tant que collecteur, je veux ouvrir l'application sur mon smartphone en mode PWA meme sans connexion 3G, afin de pouvoir travailler sur les sites de decharge isoles.

- **DoR** : Service Worker configure, manifest PWA valide, assets statiques mis en cache
- **DoD** : L'application s'ouvre hors ligne sans ecran blanc et affiche l'interface de saisie
- **Priorité** : M · **Statut déclaré** : A faire

### COL-02 — Collecteur

**Story** : en tant que collecteur, je veux saisir une declaration de collecte hors ligne avec geolocalisation, quantite estimee et materiau, afin de enregistrer les donnees immediatement sur le terrain.

- **DoR** : GPS disponible ou derniere position connue, liste des materiaux en cache local (IndexedDB)
- **DoD** : La declaration est stockee localement en attente de synchronisation et un identifiant temporaire est genere
- **Priorité** : M · **Statut déclaré** : A faire

### COL-03 — Collecteur

**Story** : en tant que collecteur, je veux modifier une declaration de collecte tant qu'elle n'a pas ete validee par le super admin, afin de corriger une erreur de pesee ou de materiau constatee apres saisie.

- **DoR** : Declaration au statut DECLAREE, modification par le collecteur auteur uniquement
- **DoD** : La declaration modifiee remplace la precedente tant que le statut reste DECLAREE ; toute modification est refusee si VALIDEE
- **Priorité** : M · **Statut déclaré** : A faire

### COL-04 — Collecteur

**Story** : en tant que collecteur, je veux voir l'historique de mes collectes synchronisees et leur statut (declaree, validee, rejetee), afin de suivre l'avancement de la validation de mon travail.

- **DoR** : Connexion retablie, synchronisation reussie
- **DoD** : La liste affiche chaque collecte avec son statut a jour retourne par le serveur
- **Priorité** : M · **Statut déclaré** : A faire

## Client

### CL-01 — Client

**Story** : en tant que client, je veux creer un compte avec mon email et mot de passe, afin de pouvoir passer des commandes et suivre mes livraisons.

- **DoR** : Formulaire d'inscription accessible, validation email et mot de passe conforme au CDC
- **DoD** : Un compte est cree avec le role CLIENT et un token JWT valide est retourne
- **Priorité** : M · **Statut déclaré** : Termine

### CL-02 — Client

**Story** : en tant que client, je veux me connecter avec mes identifiants existants, afin de retrouver mon panier, mes commandes et mes informations de livraison.

- **DoR** : Compte existant actif, mot de passe correct
- **DoD** : Token JWT retourne, acces aux fonctionnalites client sans re-authentification pendant la duree de session
- **Priorité** : M · **Statut déclaré** : Termine

### CL-03 — Client

**Story** : en tant que client, je veux consulter le catalogue de produits recyclés avec filtres par categorie (mobilier, bijoux, chaussures, accessoires), afin de trouver les articles qui m'interessent.

- **DoR** : Catalogue alimente, images optimisees pour affichage mobile (< 100 Ko)
- **DoD** : Les produits s'affichent avec nom, photo, prix en FCFA, et mention claire si en rupture de stock
- **Priorité** : M · **Statut déclaré** : Termine

### CL-04 — Client

**Story** : en tant que client, je veux payer ma commande via PayDunya (Orange Money ou Moov Money), afin de regler mes achats avec le moyen de paiement mobile le plus accessible au Burkina Faso.

- **DoR** : Panier valide, montant total calcule en FCFA, connecteur PayDunya configure
- **DoD** : La transaction PayDunya est initialisee, le client est redirige vers la page de paiement, et la commande passe a PAYEE des confirmation
- **Priorité** : M · **Statut déclaré** : En cours

### CL-05 — Client

**Story** : en tant que client, je veux voir le detail de ma commande et son statut de livraison, afin de savoir quand mes articles seront livres.

- **DoR** : Commande existante associee au compte client connecte
- **DoD** : Le detail affiche les articles, le montant total, le statut (EN_ATTENTE_PAIEMENT, PAYEE, EN_COURS_DE_LIVRAISON, LIVREE)
- **Priorité** : M · **Statut déclaré** : Termine
