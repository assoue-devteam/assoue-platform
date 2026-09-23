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
| SA-06 | En cours | Partiel — le webhook revérifie bien le statut réel, pas de vue de supervision des paiements ni de test |
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
- **Priorité** : S · **Statut déclaré** : A faire

### MG-05 — Manager

**Story** : en tant que manager, je veux etre alerte des commandes en attente de paiement depuis plus de 24h, afin de relancer les clients et limiter les commandes fantomes.

- **DoR** : Infra de notification temps reel (US-04, non couverte dans ce lot)
- **DoD** : Une alerte est visible sans devoir interroger l'API manuellement
- **Priorité** : C · **Statut déclaré** : A faire

### MG-06 — Manager

**Story** : en tant que manager, je veux suivre les inscriptions et la frequentation des formations aux metiers verts, afin de mesurer l'impact du volet formation aupres des artisans transformateurs.

- **DoR** : Module formation (non encore implemente cote API)
- **DoD** : Un tableau de bord affiche le nombre de participants par session
- **Priorité** : W · **Statut déclaré** : Exclu du scope (pilier Formation reporte)

## Collecteur

### COL-01 — Collecteur

**Story** : en tant que collecteur, je veux me connecter a mon espace collecteur depuis l'application terrain (PWA), afin de declarer mes collectes meme en zone sans reseau.

- **DoR** : Compte avec role COLLECTEUR (a creer), authentification JWT mise en cache localement apres la premiere connexion reussie
- **DoD** : Le collecteur accede a son espace hors connexion des lors qu'il s'est deja authentifie une fois avec succes
- **Priorité** : M · **Statut déclaré** : A faire

### COL-02 — Collecteur

**Story** : en tant que collecteur, je veux declarer une collecte sur le terrain (materiau, quantite estimee, geolocalisation), afin que ma collecte soit comptabilisee et alimente le stock de matiere premiere.

- **DoR** : Materiau selectionne dans une liste predefinie, quantite/poids estime saisi, geolocalisation captee par l appareil
- **DoD** : La declaration est enregistree localement au statut DECLAREE via IndexedDB et synchronisee automatiquement avec le serveur des que la connexion reseau est retablie, sans perte ni duplication de donnees
- **Priorité** : M · **Statut déclaré** : A faire

### COL-03 — Collecteur

**Story** : en tant que collecteur, je veux modifier une declaration tant qu'elle n'est pas encore validee, afin de corriger une erreur de saisie (materiau, quantite, localisation) avant qu'un manager ne traite ma collecte.

- **DoR** : Declaration existante au statut DECLAREE et m appartenant
- **DoD** : La modification n'est acceptee que si la declaration est encore au statut DECLAREE ; une declaration VALIDEE ou TRAITEE reste non modifiable
- **Priorité** : S · **Statut déclaré** : A faire

### COL-04 — Collecteur

**Story** : en tant que collecteur, je veux consulter l'historique et le statut de mes declarations (DECLAREE, VALIDEE, TRAITEE), afin de savoir si mes collectes ont ete prises en compte et suivre ma contribution.

- **DoR** : Declarations existantes liees a mon compte
- **DoD** : La liste affiche le statut a jour de chaque declaration des la resynchronisation de l'appareil
- **Priorité** : S · **Statut déclaré** : A faire

## Client

### CL-01 — Client

**Story** : en tant que client, je veux me connecter, afin de voir mon dashboard.

- **DoR** : Nom d'utilisateur/email et mot passe
- **DoD** : Le client accede a son dashboard apres une authentification reussie
- **Priorité** : M · **Statut déclaré** : Termine
- **Test** : Ok

### CL-02 — Participant

**Story** : en tant que participant, je veux M'inscrire a une formation, afin de decouvrir les metiers verts et developper mes competences.

- **DoR** : Session de formation disponible avec des places libres
- **DoD** : L'inscription est confirmee et une place est reservee dans la limite de la capacite de la session
- **Priorité** : W · **Statut déclaré** : Exclu du scope (pilier Formation reporte)

### CL-03 — Client

**Story** : en tant que client, je veux consulter le catalogue de produits recycles, afin de choisir les articles (mobilier, bijoux, accessoires) que je souhaite acheter.

- **DoR** : Catalogue public accessible par categorie
- **DoD** : La liste des produits disponibles s'affiche avec prix et disponibilite
- **Priorité** : M · **Statut déclaré** : Termine
- **Test** : Ok

### CL-04 — Client

**Story** : en tant que client, je veux passer une commande et payer en ligne via PayDunya, afin de recevoir les produits recycles que j'ai choisis.

- **DoR** : Panier contenant au moins un produit disponible
- **DoD** : La commande est creee et je suis redirige vers la page de paiement PayDunya
- **Priorité** : M · **Statut déclaré** : En cours
- **Commentaire** : Payload webhook PayDunya a valider contre un compte marchand reel avant mise en prod

### CL-05 — Client

**Story** : en tant que client, je veux suivre le statut de ma commande, afin de savoir si mon paiement a ete confirme et ma commande traitee.

- **DoR** : Commande existante m'appartenant
- **DoD** : Je retrouve le statut reel de ma commande (en attente, payee, etc.) sans notification push
- **Priorité** : S · **Statut déclaré** : Termine
- **Test** : Ok

### CL-06 — Participant

**Story** : en tant que participant, je veux consulter les supports de formation partages par le formateur, afin de continuer a apprendre apres la session en presentiel.

- **DoR** : Inscription confirmee a une session terminee
- **DoD** : Les documents partages pour ma session sont accessibles depuis mon espace
- **Priorité** : W · **Statut déclaré** : Exclu du scope (pilier Formation reporte)

---

# Backlog gelé (Won't Have — hors scope 4 semaines)

Pilier Formation reporté après la livraison. Conservé ici pour traçabilité, ne pas implémenter dans ce sprint.

## Formateur

### FM-01 — Formateur

**Story** : en tant que formateur, je veux me connecter a mon espace formateur, afin de acceder aux sessions de formation dont je suis responsable.

- **DoR** : Compte avec role FORMATEUR (a creer), authentification JWT
- **DoD** : Le formateur n'accede qu'aux sessions qui lui sont assignees
- **Priorité** : W · **Statut déclaré** : Exclu du scope (pilier Formation reporte)

### FM-02 — Formateur

**Story** : en tant que formateur, je veux creer une session de formation aux metiers verts (dates, lieu, places disponibles), afin de organiser les sessions destinees aux artisans transformateurs.

- **DoR** : Intitule, capacite, dates et lieu de la session
- **DoD** : La session cree apparait dans la liste des formations proposees aux participants
- **Priorité** : W · **Statut déclaré** : Exclu du scope (pilier Formation reporte)

### FM-03 — Formateur

**Story** : en tant que formateur, je veux consulter la liste des participants inscrits a une session, afin de preparer le contenu et le materiel adaptes au nombre d'inscrits.

- **DoR** : Session existante avec inscriptions
- **DoD** : La liste des participants inscrits est exacte et a jour
- **Priorité** : W · **Statut déclaré** : Exclu du scope (pilier Formation reporte)

### FM-04 — Formateur

**Story** : en tant que formateur, je veux marquer la presence des participants a une session, afin de suivre l'assiduite et pouvoir delivrer les attestations de formation.

- **DoR** : Session en cours ou terminee, liste des inscrits
- **DoD** : Chaque participant de la session est marque present ou absent
- **Priorité** : W · **Statut déclaré** : Exclu du scope (pilier Formation reporte)

### FM-05 — Formateur

**Story** : en tant que formateur, je veux partager des supports de formation (documents, photos) avec les participants, afin de permettre aux artisans de reviser les techniques apres la session.

- **DoR** : Fichiers associes a une session existante
- **DoD** : Les participants inscrits peuvent consulter les supports partages depuis leur espace
- **Priorité** : W · **Statut déclaré** : Exclu du scope (pilier Formation reporte)
