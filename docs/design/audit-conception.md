# AS'SOUÉ — Configuration Claude Design (phase de conception, avant maquette)

> Rapport de la phase de conception, conservé pour la traçabilité. Les décisions finales (direction B « Atelier », palette Forêt et terracotta, choix par défaut) sont dans `design-system.md`, qui fait foi en cas d'écart.

Audit réalisé sur `main` @ `f07b4d4` (26/09/2026). Les deux branches distantes `fix/backend-*` sont déjà mergées.
Sources lues : tous les controllers, DTO, services, `SecurityConfig`, `JwtAuthFilter`, `GlobalExceptionHandler`, migrations V1→V10, `docs/api-contract.md`, `docs/user-stories.md`, `docs/backlog-as-soue.md` (section « État réel vérifié — audit du 23/09/2026 »), `docs/domaine-metier.md`, `frontend/package.json`.

> **Il n'existe aucun fichier `docs/backend-audit-*.md`** dans le dépôt. L'audit de référence est la section « État réel vérifié » de `docs/backlog-as-soue.md`.

---

## 0. Corrections à apporter au prompt avant de l'envoyer à Claude Design

La liste de « gaps connus » (section 13 du prompt) est **périmée** : utilisée telle quelle, Claude Design cacherait des écrans pourtant possibles.

| Gap du prompt | État réel dans le code | Preuve |
|---|---|---|
| SA-02 pas de déblocage | **Livré** | `POST /api/utilisateurs/{id}/debloquer`, `GET /api/utilisateurs?verrouilles=true` |
| SA-06 pas de supervision paiements | **Livré** | `GET /api/paiements` (`PaiementSuperviseResponse`, champ `ecartWebhook`) |
| CL-03 pas de photo produit | **Livré côté modèle** (`imageUrl`, migration V9) — mais aucune API pour la renseigner | `ProduitResponse.imageUrl` |
| CL-05 pas de liste « mes commandes » | **Livré** | `GET /api/commandes/mes-commandes` |
| CL-04 double initiation / commande déjà payée | **Partiellement corrigé** — restent des cas limites (voir §5) | `PaiementService.initier` |
| MG-02 statut contradictoire | **Contradiction confirmée**, mais différente de ce qui est supposé (voir §5, GAP-03) | `CommandeStatut` |

Et une contradiction structurelle : **le rôle « Manager » n'existe pas dans le backend** (voir §1).

---

## 1. Audit backend

### Structure
Monolithe modulaire `bf.assoue.platform` : `auth`, `commerce`, `paiement`, `collecte`, `stock`, `common` (sécurité JWT, exceptions). Chaque module : `controller → service → repository`, `model`, `dto`. Schéma piloté par Flyway (V1→V10). Aucun code Formation (conforme au scope).

### Rôles réels
Table `role` (seed V2) : **`CLIENT`, `COLLECTEUR`, `ADMIN`. Trois rôles, pas quatre.**

- Le « Manager » et le « Super admin » du backlog sont tous les deux le **rôle `ADMIN`**. Le code le dit en toutes lettres : `/** MG-02 : le manager (rôle ADMIN) ... */` dans `CommandeController`.
- Conséquence UI : impossible de distinguer un espace Manager d'un espace Admin sans modifier le backend. **[À CONFIRMER]** : soit un seul « Espace gestion » pour ADMIN (recommandé pour la V1), soit ajout d'un rôle `MANAGER` côté backend (décision d'équipe, pas de design).
- `POST /api/auth/register` crée toujours un `CLIENT`. Les comptes `COLLECTEUR`/`ADMIN` ne sont créés que par un ADMIN (`POST /api/utilisateurs`).
- Un utilisateur peut avoir plusieurs rôles (`Set<String> roles`). **[À CONFIRMER]** comportement UI d'un compte multi-rôles (sélecteur d'espace ?).

### Authentification
- JWT HS, stateless, durée `JWT_EXPIRATION_MS` = **24 h par défaut**, pas de refresh token.
- `AuthResponse` = `{ token, email, roles }` — **ni id, ni nom, ni prénom**.
- Blocage au 3e échec → `423`. Identifiants invalides → `401`. Email pris → `409`.
- Public : `/api/auth/**`, `GET /api/produits/**`, `GET /api/categories/**`, webhook, Swagger. Tout le reste authentifié.

### Endpoints (inventaire complet)

| Méthode | Route | Rôle | Usage |
|---|---|---|---|
| POST | `/api/auth/register` | public | inscription CLIENT |
| POST | `/api/auth/login` | public | connexion |
| GET | `/api/utilisateurs?verrouilles=` | ADMIN | liste comptes (filtre verrouillés) |
| POST | `/api/utilisateurs` | ADMIN | créer compte (tout rôle) |
| PUT | `/api/utilisateurs/{id}/roles` | ADMIN | remplacer les rôles |
| POST | `/api/utilisateurs/{id}/debloquer` | ADMIN | remettre compteur d'échecs à 0 |
| GET | `/api/categories` | public | catégories |
| GET | `/api/produits?categorieId=` | public | catalogue |
| GET | `/api/produits/{id}` | public | fiche produit |
| POST | `/api/commandes` | CLIENT | créer commande |
| GET | `/api/commandes/mes-commandes` | CLIENT | historique client |
| GET | `/api/commandes/{id}` | CLIENT (les siennes) / ADMIN | détail + statut réel |
| GET | `/api/commandes?statut=` | ADMIN | toutes les commandes |
| GET | `/api/commandes/en-attente?heures=24` | ADMIN | impayées depuis X h |
| POST | `/api/paiements/commandes/{commandeId}` | CLIENT | initier PayDunya → `urlPaiement` |
| POST | `/api/paiements/webhook` | public (PayDunya) | — pas d'UI |
| GET | `/api/paiements` | ADMIN | supervision + `ecartWebhook` |
| POST | `/api/collectes` | COLLECTEUR | déclarer (idempotent via `referenceClient`) |
| PUT | `/api/collectes/{id}` | COLLECTEUR (auteur) | corriger si `DECLAREE` |
| GET | `/api/collectes/mes-collectes` | COLLECTEUR | historique |
| GET | `/api/collectes?collecteurId=&statut=` | ADMIN | toutes les collectes |
| GET | `/api/collectes/volumes` | ADMIN | cumul collecteur × matériau |
| PUT | `/api/collectes/{id}/valider` | ADMIN | DECLAREE → VALIDEE |
| PUT | `/api/collectes/{id}/traiter` | ADMIN | VALIDEE → TRAITEE (+stock MP) |
| GET | `/api/stocks/produits` | ADMIN | stock produits finis |
| GET | `/api/stocks/matieres-premieres` | ADMIN | stock matière première |
| PUT | `/api/stocks/produits/{produitId}` | ADMIN | ajuster (valeur absolue ≥ 0) |

### Machines à états

- **Commande** (`CommandeStatut`) : `EN_ATTENTE_PAIEMENT`, `PAYEE`, `EN_PREPARATION`, `EXPEDIEE`, `LIVREE`, `ANNULEE`. **Seules les transitions `EN_ATTENTE_PAIEMENT → PAYEE` existent** (via webhook revalidé).
- **Paiement** (`PaiementStatut`) : `EN_ATTENTE`, `CONFIRME`, `ECHOUE`. Un seul paiement par commande (contrainte UNIQUE).
- **Collecte** (`CollecteStatut`) : `DECLAREE → VALIDEE → TRAITEE`. Pas de rejet.

### Validation & erreurs
- Format unique `ErreurApi { horodatage, statut, message }`.
- Erreurs de validation `400` : **un seul message concaténé** (`"msg1, msg2"`), sans nom de champ → impossible d'attacher l'erreur au bon champ côté UI (voir GAP-11).
- Aucun handler générique : une exception non prévue sort en `500` au format Spring par défaut (≠ `ErreurApi`).
- Aucun `AuthenticationEntryPoint` configuré → **[À CONFIRMER par test]** un token expiré/absent renvoie probablement `403` (comportement par défaut Spring Security 6) et non `401`. L'UI ne peut alors pas distinguer « session expirée » de « accès interdit » par le code HTTP seul.

### Données exposées (ce qui peut apparaître à l'écran)
- **Produit** : `id, nom, description, prix (entier FCFA), imageUrl (nullable), categorie (nom), enRupture (booléen)`. Pas de quantité disponible, pas de créateur.
- **Catégorie** : `id, nom, description`.
- **Commande (client)** : `id, statut, dateCreation, total, lignes[{produitId, produitNom, quantite, prixUnitaire}]`. Pas d'adresse, pas de téléphone, pas de statut de paiement.
- **Commande (admin)** : idem + `clientEmail`.
- **Paiement (client)** : `commandeId, montant, statut, urlPaiement` (seulement en réponse à l'initiation).
- **Collecte** : `id, referenceClient, statut, dateDeclaration, latitude, longitude, lignes[{materiau (nom), quantiteEstimee}]`. Admin : + `collecteurId, collecteurEmail`. Pas d'unité exposée.
- **Utilisateur** : `id, email, nom, prenom, verrouille, roles`.
- **Stock** : produit `{produitId, produitNom, quantite}` ; matière `{materiauId, materiauNom, quantite}`.

### Frontend
Angular 18 standalone, aucune dépendance UI, **pas de `@angular/service-worker`** (PWA à ajouter), `styles.scss` vide, `index.html` en `lang="en"` (à passer en `fr`).

---

## 2. Architecture fonctionnelle

```
Public ─── Catalogue (accueil) ─ Fiche produit ─ Connexion ─ Inscription
Client ─── Panier (local) → Commande → Paiement PayDunya → Suivi commande
           Mes commandes
Collecteur (PWA offline-first) ─ Nouvelle déclaration ─ Mes collectes (+ file d'envoi locale)
Gestion (rôle ADMIN = manager + admin) ─ À traiter ─ Collectes ─ Commandes ─ Stocks ─ Utilisateurs ─ Paiements
```

Aligné sur `frontend/src/app/features/{auth,catalogue,commande,collecte,admin}`.

---

## 3. Matrice rôles × fonctionnalités

« Manager » n'est pas une colonne distincte : c'est `ADMIN`.

| Fonctionnalité | Public | Client | Collecteur | Admin (= Manager) | Backend |
|---|:-:|:-:|:-:|:-:|---|
| Consulter catalogue / fiche | ✓ | ✓ | ✓ | ✓ | `GET /produits`, `/categories` |
| Filtrer par catégorie | ✓ | ✓ | ✓ | ✓ | `?categorieId=` |
| Rechercher un produit | – | – | – | – | **GAP-09** (filtre client-side possible) |
| Panier | – | ✓ | – | – | aucun (local navigateur) |
| Passer commande | – | ✓ | – | – | `POST /commandes` |
| Payer (PayDunya) | – | ✓ | – | – | `POST /paiements/commandes/{id}` |
| Voir mes commandes / détail | – | ✓ | – | – | `mes-commandes`, `GET /commandes/{id}` |
| Voir toutes les commandes | – | – | – | ✓ | `GET /commandes?statut=` |
| Impayées > 24 h | – | – | – | ✓ | `GET /commandes/en-attente` |
| Changer statut commande (préparation, livraison, annulation) | – | – | – | – | **GAP-03** |
| Superviser paiements | – | – | – | ✓ | `GET /paiements` |
| Déclarer une collecte | – | – | ✓ | – | `POST /collectes` |
| Corriger une collecte (DECLAREE) | – | – | ✓ | – | `PUT /collectes/{id}` |
| Mes collectes | – | – | ✓ | – | `GET /collectes/mes-collectes` |
| Liste des matériaux | – | – | – | – | **GAP-01** (bloquant) |
| Voir / valider / traiter collectes | – | – | – | ✓ | `GET /collectes`, `valider`, `traiter` |
| Volumes par collecteur | – | – | – | ✓ | `GET /collectes/volumes` |
| Stock produits (voir, ajuster) | – | – | – | ✓ | `/stocks/produits` |
| Stock matière première (voir) | – | – | – | ✓ | `/stocks/matieres-premieres` |
| Gérer produits / catégories | – | – | – | – | **GAP-05** |
| Lister / créer utilisateurs | – | – | – | ✓ | `/utilisateurs` |
| Modifier rôles | – | – | – | ✓ | `PUT /utilisateurs/{id}/roles` |
| Débloquer un compte | – | – | – | ✓ | `POST /utilisateurs/{id}/debloquer` |
| Désactiver / supprimer un compte | – | – | – | – | absent (champ `actif` inutilisé) |
| Profil (voir / modifier) | – | – | – | – | **GAP-06** |
| Mot de passe oublié | – | – | – | – | absent |

---

## 4. Mapping backend → frontend

Format : Fonctionnalité → donnée → endpoint → rôle → écran → composants → actions → états.

- **Catalogue** → `ProduitResponse[]`, `CategorieResponse[]` → `GET /produits?categorieId=`, `GET /categories` → public → PUB-01 → Tabs/chips catégories, grille produits, Badge « Rupture de stock », Skeleton, Empty, Error → filtrer, ouvrir fiche → loading, vide, erreur réseau, catégorie vide.
- **Fiche produit** → `ProduitResponse` → `GET /produits/{id}` → public → PUB-02 → image (ou placeholder), prix, description, sélecteur quantité, Button « Ajouter au panier » (désactivé si `enRupture`) → ajouter → loading, 404, rupture.
- **Inscription / connexion** → `AuthResponse` → `/auth/register`, `/auth/login` → public → PUB-03/04 → Input, Alert, Button → soumettre → validation, 401, 409, 423, erreur serveur.
- **Panier** → état local (produitId, nom, prix, quantité) → aucun → client (consultable anonyme [À CONFIRMER]) → CLI-01 → liste lignes, stepper quantité, total → modifier, retirer, valider → vide, produit devenu en rupture (découvert au `POST`).
- **Commande** → `CommandeResponse` → `POST /commandes` → CLIENT → CLI-01 (action) → CLI-03 → Button, Alert → valider → 400 rupture, 404 produit, 401/403.
- **Paiement** → `PaiementResponse` → `POST /paiements/commandes/{id}` → CLIENT → CLI-03 → récap, Button « Payer avec Orange Money / Moov via PayDunya » → initier puis redirection `urlPaiement` → en cours, déjà payée (400), erreur, double clic.
- **Suivi commande** → `CommandeResponse` → `GET /commandes/{id}` (polling) → CLIENT → CLI-04 → statut, lignes, total, Button « Vérifier le paiement » / « Reprendre le paiement » → loading, en attente, payée, 404.
- **Mes commandes** → `CommandeResponse[]` → `GET /commandes/mes-commandes` → CLIENT → CLI-05 → liste → ouvrir → vide, erreur.
- **Déclaration collecte** → `DeclarationCollecteRequest` + UUID local + GPS → `POST /collectes` → COLLECTEUR → COL-A → Select matériau, Input quantité, bloc position, Button → enregistrer (local puis envoi) → hors ligne, GPS refusé, synchro en attente/réussie/échouée.
- **Mes collectes** → `CollecteResponse[]` + file IndexedDB → `GET /collectes/mes-collectes` → COLLECTEUR → COL-B → liste fusionnée (locales + serveur), indicateur de synchro → renvoyer, corriger → vide, hors ligne (cache), erreur.
- **Gestion collectes** → `CollecteAdminResponse[]` → `GET /collectes`, `PUT valider/traiter` → ADMIN → GES-02 → Table, filtres statut/collecteur, actions ligne, Modal de confirmation → valider, traiter → 400 transition invalide.
- **Volumes** → `VolumeCollecteResponse[]` → `GET /collectes/volumes` → ADMIN → GES-03 → Table.
- **Commandes gestion** → `CommandeAdminResponse[]`, `CommandeEnAttenteResponse[]` → `GET /commandes`, `/en-attente` → ADMIN → GES-04/05 → Table, Tabs (Toutes / Payées / En attente > 24 h), détail.
- **Stocks** → `StockProduitResponse[]`, `StockMatierePremiereResponse[]` → `/stocks/*` → ADMIN → GES-06 → Tabs, Table, édition inline quantité → ajuster → 400, 404, conflit concurrent (500 probable, V10 `@Version`).
- **Utilisateurs** → `UtilisateurResponse[]` → `/utilisateurs` → ADMIN → GES-08/09/10 → Table, Badge « Verrouillé », Modal création, Checkbox rôles → créer, débloquer, changer rôles → 409, 400.
- **Paiements** → `PaiementSuperviseResponse[]` → `GET /paiements` → ADMIN → GES-11 → Table, Badge « Écart webhook » → consulter.

---

## 5. Backend gaps

Classés par impact sur la V1. Chaque gap indique le besoin précis ; **rien n'est à coder côté backend dans cette phase**.

| ID | Gravité | Problème | Besoin précis | Impact design |
|---|---|---|---|---|
| **GAP-01** | Bloquant P0 | Aucun endpoint ne liste les matériaux ; aucun seed de matériaux. Le collecteur doit envoyer un `materiauId` qu'il ne peut pas connaître. | `GET /api/materiaux` → `[{id, nom, unite}]` (COLLECTEUR, mise en cache IndexedDB selon COL-02) + seed Plastique/Pneu | Le Select matériau de COL-A n'a pas de source. |
| **GAP-02** | Bloquant P0 | Commande sans adresse, téléphone ni mode de remise. Le client paie mais AS'SOUÉ ne sait pas où livrer. | Champs livraison sur `Commande` (adresse/quartier, ville, téléphone, éventuellement retrait sur place) — **[À CONFIRMER] processus réel de livraison** | Pas d'étape « livraison » possible dans le tunnel. |
| **GAP-03** (MG-02) | Fort | L'enum a 6 statuts, mais seuls `EN_ATTENTE_PAIEMENT` et `PAYEE` sont atteignables. Aucun endpoint pour passer en préparation / expédiée / livrée / annulée. En plus, le backlog CL-05 cite `EN_COURS_DE_LIVRAISON`, qui n'existe pas (l'enum dit `EXPEDIEE`). Le contrat d'API documente le filtre `statut` avec seulement 2 valeurs. | `PUT /api/commandes/{id}/statut` (ADMIN) + choix définitif du libellé | La frise de suivi client s'arrête à « Payée ». Les 6 statuts doivent quand même avoir un libellé et un badge (défense), mais la maquette ne doit montrer que les 2 atteignables comme parcours normal. |
| **GAP-04** (CL-04) | Fort | Paiement : (a) pas de `return_url`/`cancel_url` envoyée à PayDunya → le client n'est pas ramené sur AS'SOUÉ ; (b) le statut `ECHOUE` n'est pas visible par le client (seul le statut commande l'est) → « échoué » et « en attente » sont indiscernables ; (c) si l'appel `estEnAttente` échoue (réseau), une **nouvelle** invoice remplace le token : si le client paie l'ancienne, le webhook ne retrouve plus le paiement (404) → payé mais commande non validée ; (d) deux initiations simultanées → violation UNIQUE → `500` non géré ; (e) stock vérifié seulement « > 0 » à la commande : commander 5 quand il en reste 2 passe, puis l'échec du décrément au webhook annule la transaction → client débité, commande non payée. | (a) return/cancel URL vers `/commandes/{id}` ; (b) exposer `statutPaiement` dans `CommandeResponse` ; (c) conserver l'historique des tokens ou ne pas régénérer sur erreur réseau ; (d) verrou ou gestion du conflit en `409` ; (e) vérifier la quantité à la création | L'écran paiement doit rester prudent : « Paiement non confirmé » plutôt que « Échoué », bouton « Vérifier » et « Reprendre », jamais « Échoué » affirmé. |
| **GAP-05** | Fort | Aucun endpoint de création/modification produit, catégorie, image ; aucun seed ; `StockService.creerStockInitial` n'est exposé nulle part → un produit sans ligne de stock est toujours « en rupture ». | CRUD produit/catégorie (ADMIN) + upload ou URL image + création du stock initial — **ou** décision assumée : catalogue alimenté par SQL | Pas d'écran « Produits » en gestion. Le catalogue public sera vide sans seed. |
| **GAP-06** | Moyen | Pas de `GET /api/auth/me` ; `AuthResponse` sans nom/prénom/id. | `GET /api/utilisateurs/me` ou enrichir `AuthResponse` | Pas d'écran Profil ; l'en-tête ne peut afficher que l'email. |
| **GAP-07** | Moyen | 401 vs 403 indiscernables (probable `403` pour token expiré) ; pas de refresh ; JWT 24 h. Critique pour le collecteur hors ligne > 24 h. | `AuthenticationEntryPoint` renvoyant `401` + `ErreurApi` | Le front doit lire `exp` du JWT localement pour afficher « Session expirée » de façon fiable. |
| **GAP-08** | Moyen | Pas de statut « rejetée » pour une collecte (COL-04 le mentionne). Pas de motif. | `REJETEE` + motif, endpoint ADMIN | Le collecteur ne voit jamais un refus ; la gestion ne peut que « ne pas valider ». |
| **GAP-09** | Faible | Pas de recherche produit (NFR : « recherche < 1 s »), pas de pagination nulle part. | `?q=` sur produits ; pagination si volumes montent | Recherche en filtre local ; composant Pagination P2. |
| **GAP-10** | Faible | Quantité disponible non exposée publiquement (seulement `enRupture`). | `quantiteDisponible` ou plafond | Impossible de plafonner le stepper du panier. |
| **GAP-11** | Faible | Erreurs de validation non rattachées aux champs. | `ErreurApi.erreurs[{champ, message}]` | Validation surtout côté client ; erreur serveur en Alert en haut du formulaire. |
| **GAP-12** | Faible | Unité du matériau (`unite`) non exposée dans les réponses collecte. | Ajouter `unite` à `LigneResponse` | Afficher « 15,5 » sans unité ou coder « kg » en dur **[À CONFIRMER]**. |
| **GAP-13** | Info | Dépôt, fournisseur, compensation : modélisés, non exposés. Relation Dépôt↔Collecte non tranchée. | Décision métier | Aucune rémunération visible pour le collecteur en V1. |
| **GAP-14** | Info | Pas de tableau de bord agrégé ni d'export (MG-04 DoD : « export ou vue liste »). | — | Vue liste suffit ; pas de KPI décoratifs. |

---

## 6. Design system

### Couleurs (palette imposée conservée, tokens manquants ajoutés)

| Token | Valeur | Usage | Contraste sur blanc |
|---|---|---|---|
| `--color-primary` | `#2D6A4F` | actions principales, liens, sélection | 6,4:1 ✓ AA |
| `--color-primary-strong` | `#1B4332` | hover/pressed, en-têtes gestion | 11,1:1 ✓ |
| `--color-primary-muted` | `#3C5A40` | texte secondaire de marque, icônes | 7,7:1 ✓ |
| `--color-primary-tint` | `#E6EFEA` | fond de sélection, badge « Payée » | fond |
| `--color-accent` | `#C1440E` | un seul CTA d'achat par écran, mise en avant prix | 5,1:1 ✓ AA |
| `--color-accent-soft` | `#C1622D` | **décoratif ou texte ≥ 24 px uniquement** | 4,2:1 ✗ AA texte normal |
| `--color-accent-tint` | `#F7E7DE` | fond léger terracotta | fond |
| `--color-bg` | `#FAF8F4` | fond d'application (papier chaud, pas blanc pur) | — |
| `--color-surface` | `#FFFFFF` | cartes, tables, formulaires | — |
| `--color-surface-alt` | `#F1EDE6` | lignes alternées, zones secondaires | — |
| `--color-text` | `#1C1F1D` | texte principal | 16:1 |
| `--color-text-muted` | `#5B615C` | métadonnées, aides | 6:1 sur `bg` ✓ |
| `--color-border` | `#DDD7CC` | séparateurs décoratifs | — |
| `--color-border-strong` | `#8A8F89` | bordure des champs (≥ 3:1 non-texte) | 3,3:1 ✓ |
| `--color-success` | `#1B4332` sur `#E3EFE8` | payée, synchronisée, validée | ✓ |
| `--color-warning` | `#8A5A00` sur `#FDF3DC` | en attente, hors ligne | 5,4:1 ✓ |
| `--color-error` | `#A12622` sur `#FBE9E7` | erreurs, échec | 7,5:1 ✓ |
| `--color-info` | `#1F5A7A` sur `#E4EEF3` | info neutre, usage rare | 7,5:1 ✓ |
| `--color-focus` | `#1B4332` + halo `#C1440E` 2 px | anneau de focus | — |

**Critiques** :
- `#C1622D` échoue le contraste AA en texte courant : réservé aux grands titres, filets et illustrations.
- La terracotta `#C1440E` est proche d'un rouge d'erreur. D'où une erreur distincte, plus sombre (`#A12622`), **toujours accompagnée d'une icône et d'un texte**. Règle : la terracotta ne signale jamais un problème.
- Le « succès » est vert comme la marque : les badges de succès portent donc toujours une icône (coche) et un libellé explicite.
- Mode sombre : hors V1.

### Typographie
Une seule famille de texte, auto-hébergée, avec un sous-ensemble latin en woff2 (~40–60 Ko au total, réseau 3G) ; le choix précis dépend de la direction (§13). Base 16 px (évite le zoom iOS/Android sur les champs).

| Style | Mobile | Desktop | Graisse | Interlignage |
|---|---|---|---|---|
| Display | 28 px | 36 px | 600 | 1,15 |
| H1 | 24 px | 28 px | 600 | 1,2 |
| H2 | 20 px | 22 px | 600 | 1,25 |
| H3 | 17 px | 18 px | 600 | 1,3 |
| Body | 16 px | 16 px | 400 | 1,5 |
| Small | 14 px | 14 px | 400 | 1,45 |
| Caption | 13 px | 13 px | 400 | 1,4 (minimum absolu : 12 px) |
| Label | 14 px | 14 px | 500 | 1,3 |
| Button | 16 px | 15 px | 600 | 1 |
| Chiffres (prix, quantités, références) | chiffres tabulaires (`font-variant-numeric: tabular-nums`) | | | |

Formats : `15 000 FCFA` (espace insécable, pas de décimales), `15,5 kg`, `26/09/2026 à 14:30`, langue `fr`.

### Espacements (base 4)
`--space-1: 4` · `2: 8` · `3: 12` · `4: 16` · `5: 24` · `6: 32` · `7: 48` · `8: 64` (px).

### Rayons
`--radius-sm: 4px` (boutons, champs, badges) · `--radius-md: 8px` (cartes, modales, toasts) · `--radius-full` (avatar et pastille de statut uniquement). Pas de boutons en pilule.

### Ombres
`--shadow-1: 0 1px 2px rgba(28,31,29,.08)` (barres collantes, dropdown) · `--shadow-2: 0 8px 24px rgba(28,31,29,.14)` (modale, toast). Les cartes n'ont pas d'ombre : une bordure suffit.

### Layout & breakpoints

| | Mobile | Tablette | Desktop | Large |
|---|---|---|---|---|
| Plage | < 600 px | 600–1023 px | 1024–1279 px | ≥ 1280 px |
| Colonnes | 4 | 8 | 12 | 12 |
| Gouttière | 16 | 24 | 24 | 24 |
| Marge latérale | 16 | 24 | 32 | auto |
| Largeur max | — | — | public 1200 px / gestion fluide | gestion max 1440 px |

Frames de référence Claude Design : **360 × 800** (Android entrée de gamme), 768 × 1024, 1366 × 768 (PC de bureau courant), 1440 × 900.

Priorités : Client et Collecteur mobile-first (le Collecteur exclusivement pensé mobile) ; Gestion desktop-first mais utilisable en tablette et mobile.

---

## 7. Composants

| Composant | Variantes | États | Règles / accessibilité |
|---|---|---|---|
| **Button** | primary (vert), purchase (terracotta, un seul par écran), secondary (contour), ghost, danger | défaut, hover, focus, pressed, disabled, loading (spinner + libellé conservé) | hauteur 44 px mobile / 40 px desktop ; `aria-busy` en loading ; disabled = raison expliquée à côté |
| **Input** | text, email, password (afficher/masquer), number (quantités décimales), search | défaut, focus, filled, error, disabled, read-only | label toujours visible (jamais placeholder seul), aide sous le champ, erreur `aria-describedby` + icône |
| **Select** | natif stylé (meilleur sur Android bas de gamme) | idem Input | pas de select custom en V1 |
| **Checkbox** | simple, groupe (rôles) | coché, non coché, disabled, erreur groupe | zone tactile 44 px, `fieldset/legend` |
| **Radio** | groupe (choix matériau si ≤ 4 options) | idem | préféré au select pour 2–4 matériaux sur mobile |
| **Card** | produit, commande (liste mobile), collecte (liste mobile) | défaut, hover (desktop), focus | bordure 1 px, pas d'ombre, toute la carte cliquable avec un seul lien |
| **Badge** | statut commande, statut collecte, synchro, rupture, verrouillé, écart webhook | neutre, success, warning, error, info | **icône + texte obligatoires**, jamais la couleur seule |
| **Alert** | info, success, warning, error ; inline ou bandeau | fermable ou non | `role="alert"` pour les erreurs, `role="status"` sinon |
| **Modal** | confirmation, formulaire court | ouverte, loading, erreur | focus piégé, Échap, retour du focus ; plein écran sur mobile |
| **Navbar** | publique/client (logo, catalogue, panier + compteur, compte) ; collecteur (titre + indicateur réseau) | — | panier : compteur annoncé (`aria-label="Panier, 3 articles"`) |
| **Sidebar** | gestion desktop | élément actif, compteur « à traiter » | devient menu repliable en tablette, bottom sheet / menu en mobile |
| **Bottom nav** | collecteur mobile (Déclarer / Mes collectes) | actif | 2–3 entrées max |
| **Table** | gestion | tri, ligne sélectionnée, vide, loading | se transforme en liste de cartes < 600 px ; `<th scope>` |
| **Tabs** | filtres de statut, stocks produits/matières | actif, focus | `role="tablist"`, flèches clavier |
| **Dropdown** | menu actions ligne (gestion), menu compte | ouvert, fermé | clavier complet |
| **Avatar** | initiales uniquement (pas de photo côté backend) | — | décoratif, `aria-hidden` |
| **Pagination** | P2 (aucune pagination backend, GAP-09) | — | — |
| **Toast** | success, error | apparition 5 s, pas d'auto-fermeture pour les erreurs | `aria-live="polite"` ; jamais seul canal pour une info critique |
| **Skeleton** | carte produit, ligne de table, détail | — | `aria-busy` sur le conteneur |
| **Empty State** | texte + action utile (pas d'illustration générique) | — | ex. « Aucune commande. Parcourir le catalogue » |
| **Error State** | réseau, serveur, 404, 403 | avec action « Réessayer » | message en français, sans code technique en premier plan |
| **Sync Indicator** (spécifique) | global (barre collecteur) + par déclaration | connecté, hors ligne, N en attente, envoi en cours, échec | icône + texte + compteur ; `aria-live` |
| **Stepper quantité** | panier, fiche produit | min 1, disabled en rupture | boutons 44 px |
| **Status timeline** | suivi commande | étape atteinte, courante, future | ne montre que les étapes réellement atteignables (GAP-03) |

---

## 8. États métier

### Transverses
| État | Déclencheur réel | Traitement UI |
|---|---|---|
| Loading | toute requête | Skeleton (listes) ou bouton en loading (actions) |
| Empty | liste vide | Empty State + action |
| Validation error | contrôle client ou `400` | erreur par champ (client) ; message serveur en Alert haut de formulaire (GAP-11) |
| Unauthorized / Session expirée | `exp` du JWT dépassé (lu côté front) ou `401`/`403` sur un appel qui marchait | Page/Modal « Votre session a expiré, reconnectez-vous » + retour à la page d'origine |
| Forbidden | route hors rôle | Page « Cet espace n'est pas accessible avec votre compte » + lien vers l'espace du rôle |
| Compte bloqué | `423` | Alert dédiée : « Compte bloqué après 3 tentatives. Contactez AS'SOUÉ pour le débloquer. » **[À CONFIRMER]** canal de contact |
| Not found | `404` | page dédiée (produit, commande) |
| Server error | `500` / réponse non-`ErreurApi` | Error State générique + Réessayer |
| Offline / No Internet | `navigator.onLine` + échec réseau | client : bandeau « Pas de connexion » et actions d'achat désactivées ; collecteur : mode hors ligne normal |

### Paiement (le bug n'est pas supposé corrigé)
| État | Condition réelle | Affichage |
|---|---|---|
| Prêt à payer | commande `EN_ATTENTE_PAIEMENT` | récap + Button purchase « Payer 30 000 FCFA » + mention « Orange Money ou Moov, via PayDunya » |
| Initiation en cours | après clic | bouton désactivé + loading (anti double clic) ; `commandeId` mémorisé localement avant la redirection |
| Redirection | `200` + `urlPaiement` | « Vous allez être redirigé vers PayDunya… » puis redirection |
| Retour depuis le provider | pas de retour automatique (GAP-04a) | l'utilisateur revient via « Mes commandes » ; si un `commandeId` est mémorisé, bandeau « Vous avez un paiement en cours pour la commande n°10 — Vérifier » |
| En attente de confirmation | `GET /commandes/{id}` → `EN_ATTENTE_PAIEMENT` | « Paiement non encore confirmé » + polling toutes les 5 s pendant ~60 s, puis boutons « Vérifier à nouveau » et « Reprendre le paiement » |
| Réussi | statut `PAYEE` | Alert success + récap ; stock décrémenté côté serveur |
| Échoué | **non détectable par le client** (GAP-04b) | ne jamais afficher « Échoué » ; afficher « Non confirmé » + « Reprendre le paiement » (le backend régénère l'invoice si nécessaire) |
| Déjà payée | `400` « …statut : PAYEE » ou statut lu `PAYEE` | pas de bouton payer ; « Cette commande est déjà payée » |
| Double initiation | clic multiple / 2 onglets | bouton verrouillé ; si `500`, message « Vérifiez d'abord le statut de votre commande » + bouton Vérifier (GAP-04d) |
| Coupure pendant la transaction | US-02 | au retour du réseau, **toujours** vérifier le statut avant d'afficher quoi que ce soit |

### Collecteur
| État | Affichage (icône + texte, pas la couleur seule) |
|---|---|
| Connecté | point + « En ligne » |
| Hors ligne | icône nuage barré + « Hors ligne — vos déclarations sont enregistrées sur le téléphone » |
| Enregistrée localement | badge « Sur le téléphone » + heure de saisie |
| Synchronisation en attente | « En attente d'envoi (3) » dans la barre |
| Envoi en cours | spinner + « Envoi… » |
| Synchronisation réussie | coche + « Envoyée » puis statut serveur `Déclarée` |
| Synchronisation échouée | icône ! + raison lisible (« Session expirée, reconnectez-vous pour envoyer 3 déclarations », « Quantité refusée par le serveur ») + « Réessayer » |
| GPS indisponible / refusé | « Position non disponible » + dernière position connue (avec heure) ou saisie impossible **[À CONFIRMER]** : faut-il autoriser une saisie manuelle ? |
| Statuts serveur | `Déclarée` (modifiable), `Validée` (verrou), `Traitée` (verrou) |

Règle clé : **la file locale survit à une déconnexion de session** (JWT 24 h, GAP-07) ; on ne vide jamais IndexedDB au logout tant qu'il reste des éléments non envoyés.

---

## 9. Responsive (écrans importants)

| Écran | Mobile | Tablette | Desktop |
|---|---|---|---|
| Catalogue | 1 colonne (ou 2 compactes), catégories en chips scrollables horizontalement, panier dans la navbar | 2–3 colonnes | 4 colonnes, catégories en liste latérale ou onglets |
| Fiche produit | image pleine largeur, puis infos ; bouton d'ajout collant en bas | 2 colonnes | 2 colonnes (image 7 / infos 5) |
| Panier / commande | lignes empilées, total + CTA collants en bas | idem, plus large | 2 colonnes : lignes / récapitulatif collant |
| Mes commandes | liste de cartes (n°, date, total, badge) | idem | table |
| Déclaration collecte | formulaire une colonne, 3 champs, gros bouton en bas, barre réseau en haut | centré max 560 px | non prioritaire (centré) |
| Mes collectes | liste de cartes, file locale en premier | idem | table |
| Gestion (toutes tables) | table → cartes empilées ; filtres dans une modal « Filtrer » ; actions dans un menu « ⋯ » | table avec colonnes secondaires masquées (coordonnées GPS, email complet) | table complète + sidebar |
| Navigation gestion | menu repliable (bouton en haut) | sidebar repliée en icônes + libellés au survol/focus | sidebar fixe |
| Formulaires gestion | modal plein écran | modal centrée | modal centrée 480–560 px |

Colonnes masquées en premier : coordonnées GPS, référence client (UUID), dates de webhook, token PayDunya.

---

## 10. Accessibilité

- Contraste AA sur tous les textes (voir tableau couleurs ; `#C1622D` exclu du texte courant).
- Base 16 px, minimum 12 px ; zoom navigateur 200 % sans perte.
- Focus visible sur tout élément interactif (anneau 2 px), ordre de tabulation logique, pas de piège hors modal.
- Zones tactiles ≥ 44 × 44 px (collecteur : 48 px, usage terrain, parfois gants ou mains sales).
- Labels explicites, erreurs sous le champ, liées par `aria-describedby`, rédigées en phrases (« Indiquez une quantité supérieure à 0 »).
- Statuts : icône + libellé, jamais la couleur seule (badges, synchro, écart webhook, verrouillé).
- `aria-live` pour synchro, toasts, résultat de paiement ; `aria-busy` pendant les chargements.
- Hiérarchie sémantique : un H1 par page, landmarks (`header`, `nav`, `main`).
- Images produit : `alt` = nom du produit ; placeholder neutre si `imageUrl` est null.
- `lang="fr"`.

---

## 11. Règles anti-AI-slop (spécifiques AS'SOUÉ)

Reprendre la liste du prompt, plus :
- Pas de hero plein écran : l'accueil **est** le catalogue, précédé d'une seule ligne sur l'origine des produits (« Mobilier, bijoux, chaussures et accessoires fabriqués à Ouagadougou à partir de plastique et de pneus collectés »). **[À CONFIRMER]** : ville et formulation réelles.
- Pas de KPI décoratifs en gestion : il n'y a pas d'endpoint agrégé. La page d'accueil gestion est une **liste de choses à traiter**, chaque ligne étant issue d'un endpoint réel.
- Pas de faux compteurs d'impact (« 12 tonnes recyclées ») : aucune donnée backend ne le permet publiquement.
- Pas d'avis clients, notes, favoris, wishlist, codes promo, chat ou notifications : rien de tout ça n'existe.
- Pas d'avatar photo : initiales.
- Données fictives plausibles et marquées comme maquette : noms (Awa Ouédraogo, Issa Sawadogo, Aminata Kaboré, Boukary Compaoré, Salif Traoré, Mariam Zongo), quartiers de Ouagadougou (Tampouy, Pissy, Gounghin, Dassasgho, Karpala), coordonnées autour de 12.37 / −1.52, produits du contrat (« Chaise en pneu recyclé — 15 000 FCFA »), matériaux « Plastique », « Pneu ».

---

## 12. Contrat de design (par écran)

Légende : **Données → Endpoint → Actions → Loading / Empty / Error → Permissions → Validations → Nav entrée / sortie → Gap**.

### PUB-01 Catalogue (accueil) — P0
- Rôle : tous. Objectif : trouver un produit.
- Données : produits (nom, prix, imageUrl, catégorie, enRupture), catégories.
- Endpoints : `GET /api/categories`, `GET /api/produits?categorieId=`.
- Actions : filtrer par catégorie, ouvrir fiche, (recherche locale P1).
- Composants : Navbar, Tabs/chips, Card produit, Badge rupture, Skeleton, Empty, Error.
- Loading : skeleton 6 cartes. Empty : « Aucun produit dans cette catégorie ». Error : Error State + Réessayer.
- Nav entrée : URL racine, logo. Sortie : PUB-02, CLI-01.
- Gaps : GAP-05 (catalogue vide sans seed), GAP-09, CL-03 (images < 100 Ko à garantir hors backend).

### PUB-02 Fiche produit — P0
- Données : `ProduitResponse`. Endpoint : `GET /api/produits/{id}`.
- Actions : choisir la quantité, ajouter au panier (désactivé et libellé « Rupture de stock » si `enRupture`).
- Error : 404 → « Ce produit n'existe plus ». Validation : quantité ≥ 1.
- Nav : PUB-01 → PUB-02 → CLI-01. Gaps : GAP-10 (pas de plafond de quantité).

### PUB-03 Connexion — P0
- Endpoint : `POST /api/auth/login`. Validations : email, mot de passe requis.
- Erreurs : 401 « Email ou mot de passe incorrect » ; 423 compte bloqué ; 5xx.
- Sortie : redirection selon rôle — CLIENT → page d'origine ou PUB-01 ; COLLECTEUR → COL-A/B ; ADMIN → GES-01/02. Multi-rôle **[À CONFIRMER]**.
- Pas de « mot de passe oublié » (absent).

### PUB-04 Inscription — P0
- Endpoint : `POST /api/auth/register`. Champs : email, mot de passe (≥ 8), nom, prénom (optionnels côté backend).
- Erreurs : 409 email existant (lien vers connexion), 400.
- Sortie : connecté en CLIENT → page d'origine (souvent panier).
- Note : B2B « entreprise » non modélisé (pas de raison sociale) **[À CONFIRMER]**.

### CLI-01 Panier et validation — P0
- Données : panier local (localStorage). Endpoint à la validation : `POST /api/commandes`.
- Actions : modifier la quantité, retirer, « Commander » (exige connexion CLIENT).
- Empty : « Votre panier est vide » + lien catalogue. Error 400 : « Chaise en pneu recyclé n'est plus disponible » → marquer la ligne.
- Offline : bouton Commander désactivé + explication.
- Sortie : CLI-03 avec l'id de commande créé.
- Gap : **GAP-02 (pas d'adresse de livraison)**.

### CLI-03 Paiement — P0
- Données : `CommandeResponse` (récap), `PaiementResponse`.
- Endpoints : `GET /api/commandes/{id}` (vérifier statut avant affichage), `POST /api/paiements/commandes/{id}`.
- Actions : Payer → redirection `urlPaiement`.
- États : cf. §8 Paiement. Permission : CLIENT propriétaire (404 sinon).
- Sortie : PayDunya (externe) → retour manuel CLI-04. Gap : GAP-04 (a, b, c, d, e).

### CLI-04 Détail / suivi de commande — P0
- Endpoint : `GET /api/commandes/{id}` (polling court après retour paiement).
- Données : n°, date, lignes, total, statut. Timeline : « Commande créée → Payée » (étapes suivantes non affichées tant que GAP-03 n'est pas levé).
- Actions : Vérifier le paiement, Reprendre le paiement (si `EN_ATTENTE_PAIEMENT`).
- Error : 404. Entrée : CLI-05, bandeau « paiement en cours ». Gap : GAP-03, GAP-04b, US-04 (pas de notification → pas d'écran de notifications).

### CLI-05 Mes commandes — P0
- Endpoint : `GET /api/commandes/mes-commandes`. Liste : n°, date, total, badge statut.
- Empty : « Vous n'avez pas encore passé de commande ». Sortie : CLI-04.

### CLI-06 Profil — P2 (bloqué par GAP-06)
Ne pas maquetter en V1 ; menu compte = email + Déconnexion.

### COL-A Nouvelle déclaration — P0
- Rôle : COLLECTEUR. Objectif : déclarer en moins de 30 s, même hors ligne.
- Données : matériau, quantité estimée, position GPS, UUID local (`referenceClient`), horodatage local.
- Endpoint : `POST /api/collectes` (immédiat si en ligne, sinon file IndexedDB).
- Validations : matériau requis, quantité > 0 (décimale, virgule acceptée), position requise.
- États : §8 Collecteur. Offline : **nominal**, pas une erreur.
- Sortie : COL-B avec la nouvelle entrée en tête.
- Gap : **GAP-01 (pas de liste des matériaux : bloquant)**, GAP-12 (unité).

### COL-B Mes collectes — P0
- Données : file locale (non envoyées) + `GET /api/collectes/mes-collectes` (dernier résultat mis en cache pour l'affichage hors ligne).
- Actions : Renvoyer maintenant, Corriger (si `DECLAREE`, en ligne), voir détail.
- Empty : « Aucune déclaration. Déclarer une collecte ». Error : liste en cache + « Dernière mise à jour à 09:42 ».
- Gap : GAP-08 (pas de rejet).

### COL-C Corriger une déclaration — P1
- Endpoint : `PUT /api/collectes/{id}`. En ligne uniquement en V1 ; une déclaration non envoyée se corrige localement.
- Erreurs : 400 « n'est plus modifiable » (validée entre-temps) → rafraîchir le statut.

### GES-01 À traiter (accueil gestion) — P1
- Rôle : ADMIN. Liste de sections, chacune alimentée par un endpoint réel :
  collectes `DECLAREE` à valider (`GET /collectes?statut=DECLAREE`), collectes `VALIDEE` à traiter, commandes impayées > 24 h (`/commandes/en-attente`), comptes verrouillés (`/utilisateurs?verrouilles=true`), paiements avec écart webhook (`/paiements`, filtre `ecartWebhook` côté front).
- Pas de graphiques ni de KPI. Chaque section → liens vers l'écran concerné.

### GES-02 Collectes — P0
- Endpoints : `GET /api/collectes?collecteurId=&statut=`, `PUT …/valider`, `PUT …/traiter`.
- Colonnes : date, collecteur (email), matériau(x), quantité, position (lien carte **[À CONFIRMER]** : pas de fond de carte en V1 ?), statut, action contextuelle (Valider si DECLAREE / Traiter si VALIDEE).
- Confirmation modale pour « Traiter » (irréversible, incrémente le stock).
- Erreur 400 transition → message serveur + rafraîchissement de la ligne.

### GES-03 Volumes par collecteur — P1
- Endpoint : `GET /api/collectes/volumes`. Table collecteur × matériau × total × nb déclarations. Pas de « zone » (MG-04 le demande, le backend ne l'agrège pas).

### GES-04 Commandes — P0
- Endpoints : `GET /api/commandes?statut=`, `GET /api/commandes/en-attente?heures=24`.
- Tabs : Toutes / En attente de paiement / Payées / Impayées depuis plus de 24 h.
- Colonnes : n°, client (email), date, total, statut (+ heures d'attente dans l'onglet 24 h).
- Pas d'action de changement de statut (GAP-03). Pas de relance intégrée : afficher l'email du client (relance hors application, conforme MG-05).

### GES-05 Détail commande (gestion) — P0
- Endpoint : `GET /api/commandes/{id}`. **Attention** : ce endpoint renvoie `CommandeResponse`, **sans l'email du client** → prendre les infos client depuis la ligne de liste GES-04.

### GES-06 Stocks — P0
- Tabs : Produits finis (`GET /stocks/produits`, ajustement `PUT /stocks/produits/{id}` avec `quantite ≥ 0`) / Matière première (`GET /stocks/matieres-premieres`, lecture seule).
- Ajustement : édition en ligne + confirmation ; message « Remplace la quantité, n'ajoute pas ». Quantité 0 = badge rupture.
- Erreur de conflit concurrent : 500 probable (V10 `@Version` sans handler) → « La quantité a changé entre-temps, rechargez ».
- Gap : GAP-05 (un produit sans ligne de stock n'apparaît pas ici et reste en rupture).

### GES-08 Utilisateurs — P0
- Endpoint : `GET /api/utilisateurs?verrouilles=`. Filtre : Tous / Verrouillés. Colonnes : nom, email, rôles (badges), état (badge « Verrouillé »).
- Action : Débloquer (`POST …/debloquer`) sur les comptes verrouillés, confirmation légère.

### GES-09 Créer un compte — P0 (prérequis du flux collecteur)
- Endpoint : `POST /api/utilisateurs`. Champs : email, mot de passe provisoire (≥ 8), nom, prénom, rôles (checkbox CLIENT / COLLECTEUR / ADMIN).
- Erreurs : 409, 400 rôle inconnu. Pas d'envoi d'email du mot de passe (absent) : l'admin le transmet lui-même **[À CONFIRMER]**.

### GES-10 Modifier les rôles — P1
- Endpoint : `PUT /api/utilisateurs/{id}/roles`. Garde-fou UI : empêcher un ADMIN de se retirer son propre rôle ADMIN (pas de garde côté backend).

### GES-11 Paiements — P1
- Endpoint : `GET /api/paiements`. Colonnes : commande, client, montant, statut paiement, statut commande, statut annoncé webhook, dates, badge « Écart » si `ecartWebhook`. Token PayDunya masqué par défaut.

### Transverses — P0
403 Accès refusé · 404 · Session expirée · Erreur serveur · Bandeau hors ligne.

---

## 13. Priorités P0 / P1 / P2

| P0 (maquette 1) | P1 | P2 / exclu |
|---|---|---|
| PUB-01 Catalogue, PUB-02 Fiche, PUB-03 Connexion, PUB-04 Inscription | GES-01 À traiter | CLI-06 Profil (GAP-06) |
| CLI-01 Panier, CLI-03 Paiement, CLI-04 Suivi, CLI-05 Mes commandes | COL-C Corriger | Recherche serveur, pagination |
| COL-A Déclaration, COL-B Mes collectes (+ Sync Indicator) | GES-03 Volumes | Gestion produits/catégories (GAP-05) |
| GES-02 Collectes, GES-04/05 Commandes, GES-06 Stocks, GES-08 Utilisateurs, GES-09 Créer compte | GES-10 Rôles, GES-11 Paiements | Notifications (US-04), mode sombre |
| États transverses | Recherche locale catalogue | **Formation : exclu totalement** |

~17 écrans P0 pour 4 développeurs en 4 semaines, avec un frontend qui part de zéro et une PWA offline à construire : c'est déjà serré. Le risque le plus élevé est COL-A/COL-B (service worker, IndexedDB, synchro) : à démarrer en semaine 1.

---

## 14. Deux directions artistiques

Les deux gardent vert forêt `#2D6A4F` et terracotta `#C1440E`, les mêmes tokens et les mêmes composants. Elles diffèrent par la densité, la typographie, la navigation et le traitement des surfaces.

### Direction A — « Registre »
- **Concept** : la traçabilité comme langage visuel. L'interface ressemble à un registre bien tenu : lignes, références, quantités alignées. On sent que chaque kilo et chaque franc est compté.
- **Densité** : élevée. Listes et tables plutôt que cartes ; catalogue en grille serrée avec photo carrée plus petite.
- **Navigation** : barre supérieure sobre (public/client) ; bottom nav à 2 entrées (collecteur) ; sidebar texte sans icônes décoratives (gestion).
- **Cartes** : quasi absentes ; séparations par filets 1 px `--color-border` ; en-têtes de sections en petites capitales.
- **Boutons** : rectangulaires, radius 4 px, texte seul ; la terracotta est réservée au CTA d'achat.
- **Typographie** : IBM Plex Sans (texte) + IBM Plex Mono pour les références, quantités, prix et coordonnées.
- **Ambiance** : sérieuse, administrative au bon sens, crédible pour des clients entreprises et pour la gestion.
- **Avantages** : très cohérente de la gestion jusqu'au collecteur ; légère (peu d'images) ; rapide à implémenter en Angular (tables, listes) ; lisible au soleil.
- **Risques** : peut paraître froide pour un particulier qui achète un bijou ; met peu en valeur l'artisanat ; la mono en excès fait « outil de dev ».

### Direction B — « Atelier »
- **Concept** : la matière et la main. On met en avant l'objet fini et sa transformation ; l'interface s'efface derrière les photos de produits et une typographie éditoriale.
- **Densité** : aérée côté public/client (photos grandes, 2 colonnes max sur mobile) ; densité normale en gestion (qui reste tabulaire).
- **Navigation** : en-tête avec logo centré et menu tiroir sur mobile (public) ; bottom nav collecteur identique à A ; sidebar gestion avec fond `--color-primary-strong`.
- **Cartes** : cartes produit à image dominante, légende sous l'image (pas de texte sur photo), bordure fine ; ailleurs, surfaces sur fond `--color-bg`.
- **Boutons** : radius 4 px, plus hauts (48 px), CTA d'achat terracotta plein, secondaires en contour vert.
- **Typographie** : Source Serif 4 pour display/H1 uniquement + Source Sans 3 pour tout le reste.
- **Ambiance** : chaleureuse, artisanale, fierté du « fait ici ».
- **Avantages** : valorise les produits et la mission ; rassure les particuliers ; donne une identité distincte d'un e-commerce générique.
- **Risques** : repose sur des photos de qualité, or `imageUrl` peut être null et aucune API ne permet d'en ajouter (GAP-05) : sans photos, la direction s'effondre ; deux familles de polices = plus de poids réseau ; écart de style plus marqué entre partie publique et gestion.

---

## 15. Questions / informations manquantes

1. **Manager vs Admin** : un seul espace « Gestion » pour le rôle ADMIN en V1, ou ajout d'un rôle `MANAGER` (changement backend) ?
2. **GAP-01** : qui ajoute `GET /api/materiaux` + seed, et quelles unités (kg ? unités pour les pneus ?).
3. **GAP-02** : comment le client reçoit-il sa commande (livraison, retrait à l'atelier, paiement puis appel téléphonique) ? Sans réponse, le tunnel d'achat est incomplet.
4. **GAP-03** : libellés définitifs des statuts après « Payée » et qui les change ? Sinon la timeline client s'arrête à « Payée ».
5. **GAP-04** : l'équipe corrige-t-elle `return_url` et l'exposition du statut de paiement avant la livraison ?
6. **GAP-05** : le catalogue est-il alimenté par SQL pour la démo ? Qui fournit les photos (< 100 Ko) ?
7. Panier accessible sans connexion ? (recommandé : oui, connexion demandée à « Commander »)
8. GPS refusé : autoriser une déclaration sans position, ou la bloquer ?
9. Compte multi-rôles (ex. ADMIN + COLLECTEUR) : quel espace par défaut ?
10. Canal de contact pour un compte bloqué (téléphone, WhatsApp, email) ?
11. Logo AS'SOUÉ disponible ? (sinon : wordmark typographique, pas de logo inventé)
12. Clients entreprise (B2B) : faut-il des champs spécifiques (raison sociale, IFU) ? Rien n'existe côté backend.

---

## 16. Recommandations de configuration Claude Design

1. **Corriger d'abord la section 13 du prompt** avec le §0 et le §5 ci-dessus ; sinon Claude Design travaillera sur un état périmé du backend.
2. **Remplacer « 4 rôles » par « 3 rôles backend (CLIENT, COLLECTEUR, ADMIN) ; Manager = ADMIN »** dans la section 1 du prompt, tant que la question 1 n'est pas tranchée.
3. Fournir à Claude Design, comme contexte persistant du projet : ce document, `docs/api-contract.md`, `docs/user-stories.md`. Ne pas lui fournir `docs/domaine-metier.md` en entier (il contient le pilier Formation, qui risquerait de ressortir) : n'en extraire que les piliers Commerce et Collecte.
4. Déclarer les tokens du §6 comme design system unique (couleurs, type, espacements, rayons, ombres) et interdire toute couleur hors tokens.
5. Frames imposées : 360 × 800, 768 × 1024, 1366 × 768. Générer chaque écran P0 d'abord en 360 px (client, collecteur), et d'abord en 1366 px pour la gestion.
6. Pour chaque écran, exiger dans la maquette une planche d'états (loading, empty, error, plus offline/synchro pour le collecteur, plus les états paiement du §8).
7. Langue `fr`, montants `15 000 FCFA`, dates `26/09/2026 à 14:30`, données fictives du §11 marquées « données de maquette ».
8. Première génération : **P0 uniquement**, dans la direction choisie ; ne pas laisser Claude Design ajouter d'écrans « bonus ».
9. Demander des composants nommés comme les futurs composants Angular (`app-product-card`, `app-status-badge`, `app-sync-indicator`, `app-data-table`…) pour faciliter le passage à Claude Code.
10. Ajouter la mention explicite : « Tout élément marqué [BACKEND GAP] est représenté soit absent, soit en état désactivé annoté — jamais comme fonctionnel. »

---

*Fin de la phase de conception. En attente de validation (choix de direction A/B et réponses aux questions du §15) avant la rédaction du prompt de maquette.*
