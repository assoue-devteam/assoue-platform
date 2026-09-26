# AS'SOUÉ — Design System et référentiel validés (V1)

**Statut : VALIDÉ — source de vérité pour la maquette.** Palette retenue : **Forêt et terracotta**.
Établi à partir du code backend `assoue-devteam/assoue-platform`, branche `main`, commit `f07b4d4` (25/09/2026).
Tout ce qui n'est pas dans ce document n'existe pas pour la maquette. Toute contradiction doit être signalée, pas tranchée.

Marqueurs utilisés :
- `[BACKEND GAP]` : besoin réel que le backend ne couvre pas encore. À représenter **désactivé et annoté**, jamais comme fonctionnel.
- `[À CONFIRMER]` : décision provisoire, modifiable sans refaire la maquette.
- `[DÉMO]` : donnée fictive de démonstration, jamais présentée comme réelle.

---

## 1. Produit en une page

AS'SOUÉ est une entreprise sociale burkinabè, active sur deux piliers :
1. **Collecte tracée** de déchets (plastique, pneus) par des collecteurs terrain ;
2. **Vente B2B/B2C** de produits fabriqués à partir de ces déchets : mobilier, bijoux, chaussures, accessoires.

Paiement : **PayDunya** uniquement ; le client choisit Orange Money ou Moov Money sur la page PayDunya.
**Formation : hors scope. Aucun écran, menu, rôle ou mention.**

### Rôles (3, conformes au backend)

| Rôle backend | Nom dans l'UI | Espace |
|---|---|---|
| `CLIENT` | Client | Boutique : catalogue, panier, commandes |
| `COLLECTEUR` | Collecteur | Collecte (PWA mobile, hors ligne) |
| `ADMIN` | Gestion (manager et administrateur, une seule personne) | **Un seul espace « Gestion »**, une seule navigation |

- Un visiteur non connecté peut consulter le catalogue et remplir un panier.
- Un compte peut avoir plusieurs rôles. Espace d'arrivée après connexion : ADMIN > COLLECTEUR > CLIENT. Le menu compte permet d'aller vers les autres espaces du compte.
- Les comptes Collecteur et Gestion sont créés uniquement par la Gestion. L'inscription publique crée toujours un Client.

---

## 2. Direction artistique retenue : B « Atelier »

**Concept** : la matière et la main. L'objet fini et son origine (plastique, pneu) portent l'identité ; l'interface s'efface derrière les produits et une typographie éditoriale sobre. La traçabilité apparaît dans la précision des informations (références, quantités, dates, statuts), pas dans des décorations.

| Aspect | Public / Client | Collecteur | Gestion |
|---|---|---|---|
| Densité | aérée, photo dominante | minimale, 1 action par écran | normale à dense, tables |
| Navigation | en-tête (wordmark à gauche), menu tiroir sur mobile | barre haute + bottom nav 2 entrées | sidebar fond `--color-primary-strong` |
| Cartes | carte produit à image dominante, légende **sous** l'image | cartes de liste simples | quasi aucune, tables |
| Boutons | 48 px, CTA d'achat terracotta plein | 48 px pleine largeur | 40 px |
| Titres | serif (Display, H1) | sans-serif uniquement | serif pour H1 de page seulement |

**Photos produit** : les vraies photos seront fournies par AS'SOUÉ. D'ici là, on utilise un **emplacement neutre** : ratio 4:5, fond `--color-surface-alt`, libellé discret « Photo à venir » en `caption` `--color-text-muted`. **Pas** de photos stock génériques, pas d'illustrations générées, pas de feuilles ni de planète. Le même emplacement sert en production quand `imageUrl` est null.

**Logo** : wordmark typographique « AS'SOUÉ » en Source Serif 4 600, couleur `--color-primary-strong`. Aucun pictogramme inventé. `[À CONFIRMER]` : à remplacer par le logo officiel quand il sera fourni.

---

## 3. Tokens

Palette retenue : **Forêt et terracotta** (vert forêt `#2D6A4F` + terracotta `#C1440E`).

À reprendre tels quels (futur `styles.scss` Angular).

```css
:root {
  /* Marque (palette imposée) */
  --color-primary: #2D6A4F;
  --color-primary-strong: #1B4332;
  --color-primary-muted: #3C5A40;
  --color-primary-tint: #E6EFEA;
  --color-accent: #C1440E;          /* CTA d'achat uniquement, 1 par écran */
  --color-accent-soft: #C1622D;     /* décoratif ou texte >= 24px seulement */
  --color-accent-tint: #F7E7DE;

  /* Neutres */
  --color-bg: #FAF8F4;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F1EDE6;
  --color-text: #1C1F1D;
  --color-text-muted: #5B615C;
  --color-text-on-dark: #FFFFFF;
  --color-border: #DDD7CC;          /* séparateurs */
  --color-border-strong: #8A8F89;   /* bordures de champs */

  /* Sémantique : texte / fond */
  --color-success: #1B4332;  --color-success-bg: #E3EFE8;
  --color-warning: #8A5A00;  --color-warning-bg: #FDF3DC;
  --color-error:   #A12622;  --color-error-bg:   #FBE9E7;
  --color-info:    #1F5A7A;  --color-info-bg:    #E4EEF3;

  /* Focus */
  --focus-ring: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-primary-strong);

  /* Typographie */
  --font-display: "Source Serif 4", Georgia, serif;
  --font-text: "Source Sans 3", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Espacements (base 4) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  /* Rayons */
  --radius-sm: 4px;    /* boutons, champs, badges */
  --radius-md: 8px;    /* cartes, modales, toasts */
  --radius-full: 999px;/* avatar et pastille de statut uniquement */

  /* Ombres (2 niveaux seulement) */
  --shadow-1: 0 1px 2px rgba(28, 31, 29, .08);   /* barres collantes, dropdown */
  --shadow-2: 0 8px 24px rgba(28, 31, 29, .14);  /* modale, toast */
}
```

Règles d'usage :
- **La terracotta ne signale jamais un problème.** Les erreurs utilisent `--color-error` et sont toujours accompagnées d'une icône et d'un texte.
- Un succès est vert comme la marque : il porte donc toujours une icône (coche) et un libellé.
- `--color-accent-soft` n'est pas assez contrasté (4,2:1) pour du texte courant.
- Pas de dégradés, de transparences décoratives ni de mode sombre en V1.
- Les cartes n'ont pas d'ombre : une bordure `--color-border` de 1 px suffit.

---

## 4. Typographie

Polices auto-hébergées, sous-ensemble latin, woff2 : Source Serif 4 (600) et Source Sans 3 (400 et 600), soit environ 60 Ko au total.

| Style | Police | Mobile | Desktop | Graisse | Interlignage | Usage |
|---|---|---|---|---|---|---|
| Display | Serif | 28 | 36 | 600 | 1,15 | titre de la page catalogue, nom produit sur la fiche |
| H1 | Serif (sans pour Collecteur) | 24 | 28 | 600 | 1,2 | titre de page |
| H2 | Sans | 20 | 22 | 600 | 1,25 | sections |
| H3 | Sans | 17 | 18 | 600 | 1,3 | sous-sections, titres de carte |
| Body | Sans | 16 | 16 | 400 | 1,5 | texte courant |
| Small | Sans | 14 | 14 | 400 | 1,45 | métadonnées, cellules de table |
| Caption | Sans | 13 | 13 | 400 | 1,4 | aides, horodatages (minimum absolu : 12 px) |
| Label | Sans | 14 | 14 | 600 | 1,3 | libellés de champ, en-têtes de table |
| Button | Sans | 16 | 15 | 600 | 1 | boutons |

Prix, quantités, références et dates en chiffres tabulaires (`font-variant-numeric: tabular-nums`).

### Conventions de contenu (langue `fr`)
- Montant : `15 000 FCFA` (espace insécable, sans décimales).
- Quantité : `15,5 kg` (virgule décimale ; unité `[À CONFIRMER]`, voir GAP-12).
- Date : `26/09/2026 à 14:30` ; relative seulement dans la file hors ligne (« il y a 5 min »).
- Commande : `Commande n°10`.
- Ton : phrases courtes, vouvoiement, pas de jargon technique, pas de slogans.

### Libellés des statuts (correspondance exacte avec les enums backend)

| Enum | Libellé UI | Badge | Atteignable en V1 |
|---|---|---|---|
| `EN_ATTENTE_PAIEMENT` | En attente de paiement | warning + horloge | oui |
| `PAYEE` | Payée | success + coche | oui |
| `EN_PREPARATION` | En préparation | info | non `[BACKEND GAP]` GAP-03 |
| `EXPEDIEE` | Expédiée | info | non `[BACKEND GAP]` |
| `LIVREE` | Livrée | success | non `[BACKEND GAP]` |
| `ANNULEE` | Annulée | neutre + croix | non `[BACKEND GAP]` |
| Paiement `EN_ATTENTE` / `CONFIRME` / `ECHOUE` | En attente / Confirmé / Échoué | warning / success / error | Gestion uniquement |
| Collecte `DECLAREE` | Déclarée | neutre + crayon (modifiable) | oui |
| Collecte `VALIDEE` | Validée | info + cadenas | oui |
| Collecte `TRAITEE` | Traitée | success + coche | oui |
| Local : non envoyée | Sur le téléphone | warning + téléphone | côté front |
| Local : envoi | Envoi… | spinner | côté front |
| Local : échec | Échec d'envoi | error + ! | côté front |

---

## 5. Layout, grille, responsive

| | Mobile | Tablette | Desktop | Large |
|---|---|---|---|---|
| Largeur | < 600 px | 600–1023 px | 1024–1279 px | ≥ 1280 px |
| Colonnes | 4 | 8 | 12 | 12 |
| Gouttière | 16 | 24 | 24 | 24 |
| Marge latérale | 16 | 24 | 32 | auto |
| Largeur max | — | — | Public/Client 1200 px ; Gestion fluide | Gestion max 1440 px |

**Frames de maquette** : 360 × 800 (Android d'entrée de gamme, frame de référence), 768 × 1024, 1366 × 768.
Client et Collecteur sont conçus d'abord en 360 px ; la Gestion d'abord en 1366 px, puis adaptée.

| Élément | Mobile | Tablette | Desktop |
|---|---|---|---|
| Grille catalogue | 2 colonnes compactes | 3 | 4 |
| Catégories | chips scrollables horizontalement | chips | chips au-dessus de la grille |
| Fiche produit | image puis infos, bouton d'ajout collant en bas | 2 colonnes | 2 colonnes (7/5) |
| Panier | lignes empilées, total + CTA collants en bas | idem | lignes / récapitulatif collant (8/4) |
| Listes client/collecteur | cartes | cartes | table (client) |
| Tables Gestion | **deviennent des cartes** ; filtres dans une modale « Filtrer » ; actions dans un menu « ⋯ » | colonnes secondaires masquées | complètes |
| Navigation Gestion | bouton menu → panneau | sidebar repliée | sidebar fixe 240 px |
| Formulaires modaux | plein écran | modale centrée | modale 480–560 px |

Colonnes masquées en premier : coordonnées GPS, référence de synchronisation (UUID), dates de webhook, token PayDunya.

---

## 6. Composants

Noms = futurs composants Angular. **Aucun autre composant sans le signaler.**

| Composant | Variantes | États | Règles |
|---|---|---|---|
| `app-button` | primary (vert), purchase (terracotta, 1 par écran max), secondary (contour vert), ghost, danger | défaut, hover, focus, pressed, disabled, loading | radius 4 ; 48 px Client/Collecteur, 40 px Gestion ; loading = spinner + libellé conservé + `aria-busy` ; jamais en pilule |
| `app-input` | text, email, password (afficher/masquer), number décimal, search | défaut, focus, rempli, erreur, disabled, lecture seule | label toujours visible, aide sous le champ, erreur liée par `aria-describedby` avec icône |
| `app-select` | select natif stylé | idem input | pas de select custom |
| `app-checkbox` / `app-radio` | simple, groupe | coché, non coché, disabled, erreur de groupe | zone tactile 44 px, `fieldset` + `legend` |
| `app-product-card` | standard, en rupture, sans photo | défaut, hover, focus | image 4:5, nom (H3), catégorie (caption), prix (tabular) ; toute la carte cliquable |
| `app-status-badge` | voir §4 | — | **icône + texte obligatoires** ; radius 4 |
| `app-alert` | info, success, warning, error ; inline ou bandeau | fermable ou non | `role="alert"` (erreur) / `role="status"` |
| `app-modal` | confirmation, formulaire | ouverte, loading, erreur | focus piégé, Échap, restitution du focus ; plein écran en mobile |
| `app-header` | public, client | — | wordmark, Catalogue, Panier (compteur), Mes commandes (client), compte |
| `app-gestion-sidebar` | — | élément actif, compteur « à traiter » | fond `--color-primary-strong`, texte blanc, pas d'icônes décoratives |
| `app-bottom-nav` | Collecteur | actif | 2 entrées : Déclarer, Mes collectes |
| `app-data-table` | Gestion | tri, vide, loading, ligne en action | `th scope` ; devient une liste de cartes < 600 px |
| `app-tabs` | filtres de statut, stocks | actif, focus | `role="tablist"`, navigation aux flèches |
| `app-dropdown` | menu compte, actions de ligne | ouvert / fermé | clavier complet |
| `app-avatar` | initiales | — | pas de photo (absente du backend), `aria-hidden` |
| `app-toast` | success, error | — | `aria-live="polite"` ; erreurs sans auto-fermeture ; jamais le seul canal d'une info critique |
| `app-skeleton` | carte produit, ligne de table, détail | — | `aria-busy` sur le conteneur |
| `app-empty-state` | — | — | une phrase + une action utile ; pas d'illustration |
| `app-error-state` | réseau, serveur, 404, 403, session expirée | — | message en français + « Réessayer » ou lien utile |
| `app-quantity-stepper` | — | min, disabled (rupture) | boutons 44 px |
| `app-order-timeline` | — | étape atteinte, courante | n'affiche que « Créée → Payée » en V1 (GAP-03) |
| `app-sync-indicator` | global (barre Collecteur), par déclaration | en ligne, hors ligne, N en attente, envoi, échec | icône + texte + compteur, `aria-live` |
| `app-offline-banner` | Client | — | « Pas de connexion. Le catalogue affiché peut être ancien. » |
| `app-gap-note` | — | — | **composant de maquette uniquement** : petite étiquette `[BACKEND GAP] GAP-0X` à côté d'un élément désactivé ; non implémenté en Angular |

Pagination : non utilisée en V1 (aucune pagination backend).

### Variantes ajoutées pendant la maquette (validées)

| Variante | Composant de base | Usage |
|---|---|---|
| Feuille d'actions (bottom sheet) | `app-dropdown` | menu « ⋯ » des lignes de table en mobile |
| Modale plein écran | `app-modal` | filtres, Traiter, ajustement de stock, création de compte, en mobile |
| Bandeau sous l'en-tête | `app-alert` | paiement en cours, déclarations en attente, session expirée, autre compte connecté, connexion rétablie |
| `app-filter-chips` | boutons | filtre par catégorie (PUB-01) ; `aria-pressed` sur le bouton actif, défilement horizontal en mobile |
| Bouton « Copier » | `app-button` ghost | email ou position ; 40 px desktop, 44 px mobile ; toast de confirmation |

Correspondance avec la maquette : `ShopHeader` = `app-header`, `ProductCard` = `app-product-card`.

---

## 7. Architecture des écrans et routes

```text
PUBLIC
├── /                       PUB-01 Catalogue (= accueil)                       P0
├── /produits/:id           PUB-02 Fiche produit                               P0
├── /connexion              PUB-03 Connexion                                   P0
├── /inscription            PUB-04 Inscription                                 P0
└── /panier                 CLI-01 Panier (visiteur autorisé)                  P0

CLIENT
├── /commandes              CLI-05 Mes commandes                               P0
├── /commandes/:id          CLI-04 Détail et suivi de commande                 P0
└── /commandes/:id/paiement CLI-03 Paiement PayDunya                           P0

COLLECTEUR (mobile)
├── /collecte               COL-B Mes collectes (+ file d'envoi locale)        P0
├── /collecte/nouvelle      COL-A Nouvelle déclaration                         P0
└── /collecte/:id/modifier  COL-C Corriger une déclaration                     P1

GESTION (rôle ADMIN, espace unique)
├── /gestion                GES-01 À traiter                                   P1
├── /gestion/collectes      GES-02 Collectes (valider, traiter)                P0
├── /gestion/volumes        GES-03 Volumes par collecteur                      P1
├── /gestion/commandes      GES-04 Commandes (+ impayées > 24 h)               P0
├── /gestion/commandes/:id  GES-05 Détail commande                             P0
├── /gestion/stocks         GES-06 Stocks (produits finis, matière première)   P0
├── /gestion/utilisateurs   GES-08 Utilisateurs (+ créer, débloquer)           P0
│                           GES-09 Créer un compte (modale)                    P0
│                           GES-10 Modifier les rôles (modale)                 P1
└── /gestion/paiements      GES-11 Supervision des paiements                   P1

TRANSVERSES (P0) : 404 · Accès refusé · Session expirée (modale) · Erreur serveur · Hors ligne
```

Tant que GES-01 (P1) n'est pas maquetté, la Gestion arrive sur `/gestion/collectes`.

### Navigation par rôle
- **Visiteur** : wordmark → `/` · Catalogue · Panier (n) · Se connecter.
- **Client** : même en-tête + Mes commandes + menu compte (email, Déconnexion). Pas de page Profil (GAP-06).
- **Collecteur** : barre haute (titre de page + `app-sync-indicator` + menu compte) ; bottom nav : Déclarer · Mes collectes.
- **Gestion** : sidebar : À traiter · Collectes · Volumes · Commandes · Stocks · Utilisateurs · Paiements ; pied de sidebar : email, « Voir la boutique », Déconnexion.
- **Après action** : commande créée → paiement ; paiement → redirection PayDunya ; déclaration enregistrée → Mes collectes avec la nouvelle entrée en tête ; connexion → page d'origine, sinon l'espace du rôle.
- **Route hors rôle** → page « Accès refusé » avec un lien vers l'espace de l'utilisateur.
- **Session expirée** (date `exp` du JWT dépassée, lue côté front) → modale « Votre session a expiré », reconnexion, puis retour à la page en cours.

---

## 8. Contrat de design par écran

Format : **Données** · **Endpoint(s)** · **Actions** · **États** · **Permission** · **Validations** · **Gap**.

### PUB-01 Catalogue (accueil) — P0
- Données : produits (`id, nom, description, prix, imageUrl, categorie, enRupture`), catégories (`id, nom, description`).
- Endpoints : `GET /api/categories`, `GET /api/produits?categorieId=`.
- En-tête de page : H1 Display « Objets fabriqués à partir de déchets collectés au Burkina Faso » + une ligne d'explication `[À CONFIRMER : formulation fournie par AS'SOUÉ]`. **Pas de hero, pas de chiffres d'impact.**
- Actions : filtrer par catégorie (chips, « Tout » par défaut), filtre texte local sur le nom (P1, pas d'endpoint de recherche, GAP-09), ouvrir une fiche.
- États : skeleton 6 cartes · vide « Aucun produit dans cette catégorie pour le moment » · erreur réseau + Réessayer · hors ligne (bandeau).
- Permission : public.

### PUB-02 Fiche produit — P0
- Endpoint : `GET /api/produits/{id}`.
- Affiche : photo (ou emplacement), nom (Display), catégorie, prix, description, stepper de quantité, bouton purchase « Ajouter au panier ».
- En rupture : badge « Rupture de stock » + bouton désactivé avec le texte « Indisponible pour le moment ».
- Stock restant non affiché (GAP-10 : seul `enRupture` existe).
- États : skeleton · 404 « Ce produit n'est plus disponible » · erreur.
- Après ajout : toast « Ajouté au panier » + compteur du panier mis à jour ; on reste sur la fiche.

### PUB-03 Connexion — P0
- Endpoint : `POST /api/auth/login`. Champs : email, mot de passe.
- Erreurs : 401 → « Email ou mot de passe incorrect » ; 423 → Alert « Votre compte est bloqué après 3 tentatives. Contactez AS'SOUÉ pour le débloquer : [À CONFIRMER : téléphone / WhatsApp] » ; erreur serveur.
- Pas de lien « Mot de passe oublié » (inexistant). Lien « Créer un compte ».

### PUB-04 Inscription — P0
- Endpoint : `POST /api/auth/register`. Champs : prénom, nom, email, mot de passe (au moins 8 caractères, règle affichée sous le champ).
- Erreurs : 409 → « Un compte existe déjà avec cet email » + lien vers Se connecter ; 400.
- Après succès : connecté en Client, retour à la page d'origine (souvent le panier).
- Pas de champs entreprise (raison sociale, IFU) : non modélisés.

### CLI-01 Panier — P0
- Données : panier local (id produit, nom, prix, quantité, photo), sans endpoint. À la validation : `POST /api/commandes` `{ lignes: [{ produitId, quantite }] }`.
- Affiche : lignes, stepper, Retirer, total (calculé en local, confirmé par la réponse serveur), bloc « Livraison ».
- **Bloc Livraison** : champs prévus (téléphone, quartier, ville, instructions) **désactivés** + `app-gap-note` « [BACKEND GAP] GAP-02 : la commande n'enregistre pas encore d'adresse. AS'SOUÉ vous contactera. `[À CONFIRMER]` ».
- Actions : « Commander » (bouton purchase). Visiteur → connexion, puis retour au panier.
- États : vide « Votre panier est vide » + lien catalogue · création en cours (bouton en loading) · 400 rupture → ligne marquée « N'est plus disponible », commande bloquée tant qu'elle est présente · hors ligne → bouton désactivé + raison.
- Succès → CLI-03.

### CLI-03 Paiement — P0
- Endpoints : `GET /api/commandes/{id}` (statut vérifié avant affichage), puis `POST /api/paiements/commandes/{id}` → `{ commandeId, montant, statut, urlPaiement }`.
- Affiche : récapitulatif (lignes, total), une phrase « Vous serez redirigé vers PayDunya pour payer avec Orange Money ou Moov Money », bouton purchase « Payer 30 000 FCFA ».
- États : voir §9 Paiement.
- Permission : Client propriétaire de la commande (sinon 404 → page « Commande introuvable »).

### CLI-04 Détail et suivi de commande — P0
- Endpoint : `GET /api/commandes/{id}`.
- Affiche : Commande n°, date, `app-order-timeline` (Créée → Payée), lignes, total, statut.
- Si `EN_ATTENTE_PAIEMENT` : boutons « Vérifier le paiement » et « Reprendre le paiement ». Après un retour depuis PayDunya : vérification automatique toutes les 5 s pendant 60 s.
- Étapes au-delà de Payée : non affichées. Note sous la frise : « Le suivi de préparation et de livraison arrive bientôt » + `app-gap-note` GAP-03.
- Pas de notifications (US-04 absente).

### CLI-05 Mes commandes — P0
- Endpoint : `GET /api/commandes/mes-commandes` (plus récentes d'abord).
- Mobile : cartes (n°, date, total, badge). Desktop : table.
- Bandeau en haut si un paiement a été initié depuis cet appareil : « Paiement en cours pour la commande n°10 — Vérifier ».
- États : skeleton · vide « Vous n'avez pas encore passé de commande » + lien catalogue · erreur.

### COL-A Nouvelle déclaration — P0 (mobile)
- Envoi : `POST /api/collectes` `{ referenceClient (UUID généré localement), materiauId, quantiteEstimee, localisation { lat, lng } }`. L'envoi est idempotent grâce à `referenceClient`.
- Champs :
  1. **Matériau** : radio (Plastique / Pneu). Source `[BACKEND GAP]` GAP-01 : aucun endpoint ne liste les matériaux. En maquette, valeurs `[DÉMO]` annotées.
  2. **Quantité estimée** : nombre décimal > 0, clavier numérique, unité affichée « kg » `[À CONFIRMER]` GAP-12.
  3. **Position** : récupérée automatiquement ; affiche « Position relevée à 09:42 (précision ~15 m) » et « Actualiser ».
- GPS refusé ou indisponible : on utilise la dernière position connue, en affichant son heure. S'il n'y en a aucune, la déclaration est impossible et le message l'explique : « Activez la localisation pour déclarer. La position est obligatoire. » Pas de saisie manuelle : le backend exige lat/lng.
- Bouton « Enregistrer la déclaration » (48 px, pleine largeur, primary).
- Après appui : enregistrement **toujours d'abord local** (IndexedDB), puis envoi si en ligne. Feedback immédiat : « Déclaration enregistrée sur le téléphone » puis « Envoyée ».
- Hors ligne : **fonctionnement normal**, pas une erreur.

### COL-B Mes collectes — P0 (mobile)
- Données : file locale non envoyée (en premier) + `GET /api/collectes/mes-collectes` (dernière réponse mise en cache).
- Chaque élément : matériau, quantité, date, statut local ou serveur (§4), position abrégée.
- Actions : « Envoyer maintenant » (s'il y a des éléments en attente), Réessayer (en cas d'échec), Corriger (si `DECLAREE` et en ligne, P1).
- États : vide « Aucune déclaration pour le moment » + bouton Déclarer · hors ligne → liste en cache + « Dernière mise à jour à 09:42 ».
- Pas de statut « Rejetée » (GAP-08).

### COL-C Corriger une déclaration — P1
- `PUT /api/collectes/{id}` (en ligne uniquement). Une déclaration non encore envoyée se corrige localement.
- 400 « n'est plus modifiable » → « Cette déclaration vient d'être validée, elle ne peut plus être modifiée » + mise à jour du statut.

### GES-01 À traiter — P1
Sections, chacune avec son nombre d'éléments et un lien :
- collectes à valider (`GET /api/collectes?statut=DECLAREE`) ;
- collectes à traiter (`?statut=VALIDEE`) ;
- commandes impayées depuis plus de 24 h (`GET /api/commandes/en-attente?heures=24`) ;
- comptes bloqués (`GET /api/utilisateurs?verrouilles=true`) ;
- paiements avec écart webhook (`GET /api/paiements`, filtre local sur `ecartWebhook`).

**Aucun graphique, aucun KPI décoratif.**

### GES-02 Collectes — P0
- Endpoints : `GET /api/collectes?collecteurId=&statut=`, `PUT /api/collectes/{id}/valider`, `PUT /api/collectes/{id}/traiter`.
- Tabs : Toutes · À valider (DECLAREE) · À traiter (VALIDEE) · Traitées. Filtre par collecteur (select).
- Colonnes : date, collecteur (email), matériau, quantité, position (lat, lng en texte ; pas de carte en V1), statut, action.
- Action contextuelle : « Valider » si DECLAREE ; « Traiter » si VALIDEE, avec modale de confirmation « Cette action ajoute 15,5 kg de Plastique au stock de matière première et ne peut pas être annulée ».
- Aucune action « Rejeter » (GAP-08).
- Erreur 400 → message serveur + rechargement de la ligne.

### GES-03 Volumes — P1
- `GET /api/collectes/volumes`. Table : collecteur, matériau, quantité totale, nombre de déclarations. Pas de vue « par zone » (non calculée par le backend).

### GES-04 Commandes — P0
- Endpoints : `GET /api/commandes?statut=`, `GET /api/commandes/en-attente?heures=24`.
- Tabs : Toutes · En attente de paiement · Payées · Impayées depuis plus de 24 h.
- Colonnes : n°, client (email), date, total, statut ; dans l'onglet 24 h : heures d'attente.
- Relance hors application : l'email du client est affiché et copiable.
- **Aucune action de changement de statut** : `app-gap-note` GAP-03.

### GES-05 Détail commande — P0
- `GET /api/commandes/{id}` (ne renvoie pas l'email du client : on le reprend depuis la liste). Affiche les lignes, le total, le statut et la frise.

### GES-06 Stocks — P0
- Tabs :
  - Produits finis : `GET /api/stocks/produits`, ajustement par `PUT /api/stocks/produits/{produitId}` `{ quantite ≥ 0 }` ;
  - Matière première : `GET /api/stocks/matieres-premieres`, lecture seule.
- Ajustement : édition en ligne → modale « Nouvelle quantité en stock (remplace la valeur actuelle) ». Quantité 0 → badge « Rupture ».
- Création de produit ou de catégorie : absente. `app-gap-note` GAP-05 près du titre.
- Conflit (modification simultanée) → « La quantité a changé entre-temps. Rechargez la page. »

### GES-08 Utilisateurs — P0
- `GET /api/utilisateurs?verrouilles=`. Tabs : Tous · Bloqués.
- Colonnes : nom, email, rôles (badges), état (« Bloqué » + cadenas), actions.
- « Débloquer » (`POST /api/utilisateurs/{id}/debloquer`) → toast « Le compte de Issa Sawadogo est débloqué ».
- Bouton « Créer un compte » → GES-09.
- Pas de suppression, de désactivation ni de réinitialisation de mot de passe (inexistantes).

### GES-09 Créer un compte — P0 (modale)
- `POST /api/utilisateurs`. Champs : prénom, nom, email, mot de passe provisoire (au moins 8), rôles (checkbox : Client, Collecteur, Gestion ; au moins un).
- Aide : « Communiquez ce mot de passe à la personne. Aucun email n'est envoyé automatiquement. »
- Erreurs : 409 email existant, 400.

### GES-10 Modifier les rôles — P1 (modale)
- `PUT /api/utilisateurs/{id}/roles`. Garde-fou côté UI : on ne peut pas retirer son propre rôle Gestion.

### GES-11 Paiements — P1
- `GET /api/paiements`. Colonnes : commande, client, montant, statut paiement, statut commande, statut annoncé par le webhook, dates (création, dernier webhook, confirmation), badge « Écart » (error + !) si `ecartWebhook`.
- Token PayDunya masqué, affichable à la demande.

---

## 9. États

### Transverses
| État | Déclencheur | Rendu |
|---|---|---|
| Chargement | requête | skeleton (listes, détails) ; bouton en loading (actions) |
| Vide | liste vide | `app-empty-state` + action |
| Erreur de validation | contrôle côté client | message sous le champ, rédigé en phrase |
| Erreur de validation serveur | `400` | Alert en haut du formulaire avec le message serveur (GAP-11 : pas de rattachement au champ) |
| Erreur métier | `400` avec message (rupture, transition invalide) | Alert contextuelle ou marquage de la ligne |
| Non authentifié | route protégée sans session | redirection vers la connexion, puis retour |
| Session expirée | `exp` du JWT dépassé ou 401/403 inattendu | modale de reconnexion (GAP-07) |
| Accès refusé | route hors rôle | page dédiée + lien vers l'espace de l'utilisateur |
| Introuvable | 404 | page dédiée |
| Erreur serveur | 5xx | `app-error-state` + Réessayer |
| Réseau / hors ligne | pas de connexion | Client : `app-offline-banner`. « Ajouter au panier » reste actif (panier local) ; « Commander », « Payer », la connexion et l'inscription sont désactivés, avec la raison affichée. Collecteur : mode normal |

### Paiement

Nominal = **comportement actuel du backend**. Les états qui dépendent d'une correction backend sont présentés **à part**, marqués `[BACKEND GAP]`.

| État | Rendu |
|---|---|
| Prêt à payer | récapitulatif + « Payer 30 000 FCFA » |
| Initiation en cours | bouton désactivé en loading (anti double clic) ; numéro de commande mémorisé sur l'appareil |
| Redirection | « Redirection vers PayDunya… » |
| Retour sur AS'SOUÉ | le client revient de lui-même (pas de retour automatique) ; bandeau « Paiement en cours pour la commande n°10 — Vérifier » sur Mes commandes et le catalogue |
| Vérification | « Nous vérifions votre paiement auprès de PayDunya… » (vérification toutes les 5 s pendant 60 s) |
| Non confirmé | « Paiement non encore confirmé. Si vous avez payé, la confirmation peut prendre quelques minutes. » + Vérifier à nouveau + Reprendre le paiement. **Jamais « Échoué » côté client.** « Reprendre le paiement » vérifie **toujours** le statut (`GET /api/commandes/{id}`) avant d'appeler l'initiation : si la commande est payée entre-temps, on affiche « Réussi » au lieu de relancer. Le risque GAP-04 (facture remplacée) est une annotation `app-gap-note` pour l'équipe, **jamais un texte visible par le client**. |
| Réussi | Alert success « Paiement confirmé. Commande n°10 payée. » |
| Déjà payée | pas de bouton payer ; « Cette commande est déjà payée » |
| Double initiation | bouton verrouillé ; en cas d'erreur serveur : « Vérifiez d'abord le statut de votre commande » + Vérifier |
| Coupure réseau | au retour de la connexion : vérification du statut **avant** tout affichage |
| **Cible** `[BACKEND GAP] GAP-04` | retour automatique depuis PayDunya sur `/commandes/:id` ; état « Paiement échoué » avec Réessayer. Présenté sur une planche séparée, annotée. |

### Collecteur
| État | Rendu (icône + texte, jamais la couleur seule) |
|---|---|
| En ligne | pastille + « En ligne » |
| Hors ligne | nuage barré + « Hors ligne — vos déclarations restent sur le téléphone » |
| Enregistrée localement | badge « Sur le téléphone » + heure |
| En attente d'envoi | barre : « 3 déclarations en attente d'envoi » + Envoyer maintenant |
| Envoi en cours | spinner + « Envoi… » |
| Envoyée | coche + « Envoyée », puis statut serveur « Déclarée » |
| Échec d'envoi | ! + raison lisible + action : « Session expirée : reconnectez-vous pour envoyer 3 déclarations » / « Refusée par le serveur : quantité invalide » + Réessayer |
| GPS indisponible | voir COL-A |

La file locale **n'est jamais effacée** à la déconnexion tant qu'il reste des déclarations non envoyées. La session dure 24 h sans renouvellement ; au-delà, l'envoi exige une reconnexion.

Chaque déclaration de la file est rattachée à l'email du collecteur qui l'a saisie. Le backend attribue une déclaration au compte connecté au moment de l'envoi. Si un **autre compte** se connecte sur le téléphone, la file n'est donc **pas envoyée** : message « 3 déclarations saisies par issa.sawadogo@example.com attendent sur ce téléphone. Reconnectez-vous avec ce compte pour les envoyer. »

Bandeau « Connexion rétablie » (Client et Collecteur) : couleurs success, icône + texte, `aria-live="polite"`, visible au moins 5 s.

---

## 10. Backend gaps (liste à jour, remplace toute liste antérieure)

**Livrés** (ne sont plus des gaps) : SA-02 déblocage de compte · SA-06 supervision des paiements · CL-03 champ `imageUrl` · CL-05 `GET /api/commandes/mes-commandes`.

| ID | Écrans | Manque | Rendu maquette |
|---|---|---|---|
| GAP-01 | COL-A | liste des matériaux (`GET /api/materiaux`) + données de base | valeurs `[DÉMO]` annotées |
| GAP-02 | CLI-01 | adresse, téléphone, mode de livraison sur la commande | bloc désactivé annoté |
| GAP-03 (MG-02) | CLI-04, GES-04/05 | transitions après Payée (préparation, expédition, livraison, annulation) ; libellé « EN_COURS_DE_LIVRAISON » du backlog ≠ enum `EXPEDIEE` | frise limitée à Créée → Payée ; aucune action statut |
| GAP-04 (CL-04) | CLI-03/04 | pas de retour automatique depuis PayDunya ; échec invisible pour le client ; la reprise d'un paiement après une coupure réseau peut remplacer une facture PayDunya encore payable ; deux initiations simultanées → erreur 500 ; commander plus que le stock restant → client débité mais commande non validée | parcours prudent (§9) + planche cible |
| GAP-05 | PUB-01, GES-06 | création de produit, catégorie, photo et stock initial | catalogue `[DÉMO]` ; note sur Stocks |
| GAP-06 | en-tête | profil (`/me`, nom, prénom) | email seul dans le menu compte |
| GAP-07 | transverse | 401 et 403 indiscernables, pas de renouvellement de session | expiration détectée côté front |
| GAP-08 | COL-B, GES-02 | statut « Rejetée » | aucune action Rejeter |
| GAP-09 | PUB-01 | recherche serveur, pagination | filtre local (P1) |
| GAP-10 | PUB-02, CLI-01 | quantité disponible | pas de plafond affiché |
| GAP-11 | formulaires | erreurs serveur par champ | Alert en haut du formulaire |
| GAP-12 | COL-A/B, GES-02 | unité du matériau | « kg » `[À CONFIRMER]` |
| GAP-13 | COL-C | la réponse d'une collecte donne le **nom** du matériau, pas son `materiauId` ; le formulaire de correction ne peut pas être pré-rempli de façon fiable | pré-remplissage par correspondance de nom avec la liste des matériaux (dépend de GAP-01), annoté |

**Hors périmètre V1 (volontaire)** : Dépôt fournisseur, Fournisseur, Compensation. Modélisés en base (`Collecte.depot`), mais la relation Dépôt ↔ Collecte n'est pas tranchée et aucun endpoint ne les expose. Aucun écran, champ ni mention dans la maquette.

---

## 11. Décisions par défaut appliquées

1. Espace unique « Gestion » pour le rôle ADMIN (manager et admin).
2. Panier accessible sans connexion ; connexion demandée au moment de « Commander ».
3. GPS : dernière position connue autorisée (heure affichée) ; sans aucune position, la déclaration est bloquée avec une explication.
4. Compte à plusieurs rôles : arrivée ADMIN > COLLECTEUR > CLIENT, passage d'un espace à l'autre par le menu compte.
5. Compte bloqué : message avec un contact AS'SOUÉ `[À CONFIRMER]`.
6. Logo : wordmark typographique provisoire.
7. B2B : même parcours que B2C, sans champs entreprise.
8. Paiement : nominal = backend actuel ; cible sur une planche annotée.
9. Livraison : bloc désactivé annoté GAP-02.
10. Photos : emplacements neutres en attendant le catalogue d'AS'SOUÉ.
11. Graphie du nom : « AS'SOUÉ » dans l'interface. Le code et les docs techniques écrivent « AS'Soué » `[À CONFIRMER : graphie officielle]`.
12. Livraison : c'est AS'SOUÉ qui contacte le client après le paiement ; canal et délai `[À CONFIRMER]` (lié à GAP-02).

---

## 12. Données de démonstration `[DÉMO]`

À utiliser telles quelles. **Données de maquette, jamais présentées comme réelles.**

**Catégories** : Mobilier · Bijoux · Chaussures · Accessoires.

| # | Produit | Catégorie | Prix | État |
|---|---|---|---|---|
| 1 | Chaise en pneu recyclé | Mobilier | 15 000 FCFA | disponible |
| 2 | Pouf en pneu tressé | Mobilier | 12 500 FCFA | disponible |
| 3 | Table basse pneu et bois | Mobilier | 35 000 FCFA | disponible |
| 4 | Bracelet en perles de plastique recyclé | Bijoux | 2 500 FCFA | disponible |
| 5 | Boucles d'oreilles en sachets fondus | Bijoux | 3 000 FCFA | disponible, **sans photo** |
| 6 | Collier multicolore en plastique recyclé | Bijoux | 4 500 FCFA | disponible |
| 7 | Sandales à semelle de pneu | Chaussures | 6 000 FCFA | **en rupture** |
| 8 | Babouches à semelle de pneu | Chaussures | 7 500 FCFA | disponible |
| 9 | Sac tressé en sachets plastique | Accessoires | 8 000 FCFA | disponible |
| 10 | Trousse en bâche recyclée | Accessoires | 3 500 FCFA | disponible |

Descriptions : 1 à 2 phrases factuelles sur la matière et l'usage (ex. « Assise tressée sur une structure en pneu récupéré. Usage intérieur et extérieur. »).

**Utilisateurs**
- Client : Awa Ouédraogo — awa.ouedraogo@example.com
- Client (entreprise) : Salif Traoré — achats@example.com
- Collecteurs : Issa Sawadogo (issa.sawadogo@example.com), Mariam Zongo (mariam.zongo@example.com)
- Gestion : Boukary Compaoré — boukary.compaore@example.com
- Compte bloqué : Aminata Kaboré (Cliente)

**Commandes** : n°10 Awa, 2 × Chaise en pneu recyclé, 30 000 FCFA, En attente de paiement depuis 30 h · n°11 Awa, 1 × Sac tressé, 8 000 FCFA, Payée · n°12 Salif, 3 × Pouf, 37 500 FCFA, Payée.

**Collectes** (quartiers de Ouagadougou, coordonnées autour de 12.37 / −1.52) :
Issa, Plastique 15,5 kg, Tampouy, Déclarée · Issa, Pneu 42 kg, Pissy, Validée · Mariam, Plastique 8 kg, Gounghin, Traitée · Mariam, Plastique 11 kg, Dassasgho, Sur le téléphone · Issa, Pneu 20 kg, Karpala, Échec d'envoi (session expirée).

**Stocks** : produits finis de 0 à 14 unités (Sandales = 0) ; matière première : Plastique 124,5 kg, Pneu 310 kg.

---

## 13. Accessibilité (obligatoire)

- Contraste AA partout ; `--color-accent-soft` exclu du texte courant.
- Base 16 px, minimum 12 px ; zoom à 200 % sans perte.
- Focus visible (`--focus-ring`) sur tout élément interactif ; ordre de tabulation logique.
- Zones tactiles ≥ 44 px, **48 px pour le Collecteur**.
- Labels visibles, erreurs rédigées en phrases et liées au champ.
- Statuts : icône + texte, jamais la couleur seule.
- `aria-live` pour la synchronisation, les toasts et le résultat du paiement ; `aria-busy` pendant les chargements.
- Un H1 par page ; landmarks `header` / `nav` / `main` ; `lang="fr"` ; `alt` = nom du produit.

## 14. Anti-AI-slop (spécifique AS'SOUÉ)

Interdits : hero plein écran, chiffres d'impact inventés, KPI décoratifs, dégradés, glassmorphism, boutons en pilule, radius > 8 px (hors avatar et pastille), ombres sur les cartes, icônes décoratives, emojis, illustrations génériques (feuilles, planète, mains qui tiennent une plante), photos stock, violet ou bleu SaaS, lorem ipsum, « John Doe », slogans.
Également interdits, car inexistants dans le backend : avis clients, notes, favoris, codes promo, chat, notifications, mot de passe oublié, page profil, carte interactive, exports.

## 15. Priorités

- **P0** : PUB-01, PUB-02, PUB-03, PUB-04, CLI-01, CLI-03, CLI-04, CLI-05, COL-A, COL-B, GES-02, GES-04, GES-05, GES-06, GES-08, GES-09, états transverses.
- **P1** : GES-01, COL-C, GES-03, GES-10, GES-11, filtre texte du catalogue.
- **P2** : profil, pagination, gestion du catalogue.
- **Exclu** : Formation, sous toutes ses formes.

## 16. Textes d'interface validés pendant la maquette

À réutiliser tels quels dans Angular. Ils s'ajoutent aux textes des §8 et §9.

- **Boutique** : « Vous serez invité à vous connecter. » · « Retirez les produits indisponibles pour commander. » · « Connexion internet nécessaire pour commander. » (idem pour payer, se connecter, créer un compte) · « Connectez-vous pour passer votre commande. Votre panier est conservé. »
- **Paiement** : « Ouvrir PayDunya si rien ne se passe » · « Nous vérifions votre commande avant le paiement… » · « Vérifiez le lien, ou retrouvez vos commandes dans Mes commandes. » (commande introuvable) · « Votre paiement avait bien été reçu : aucun nouveau paiement n'est nécessaire. »
- **Collecte** : « Recherche de la position… » · « En attente de la position… » · « Position obligatoire pour enregistrer. » · « Réessayer la localisation » · « Elle sera envoyée automatiquement au retour de la connexion. » · sections « Sur ce téléphone » et « Envoyées » · « Se déconnecter et changer de compte » (ne vide pas la file locale).
- **Gestion** : « Collecte traitée : 42 kg de Pneu ajoutés au stock » · « Email copié » · « Aucun compte bloqué. » · « Copier la position » · « Copier l'email » · « Le compte d'Aminata Kaboré est débloqué » · erreur 400 = message exact du backend + « La ligne a été rechargée. »
- **Transverses** : « Votre panier est conservé. » · « Elle reste / Elles restent sur le téléphone : rien n'est effacé. » · « 3 déclarations attendent l'envoi sur ce téléphone. Elles seront envoyées après la connexion. » · « Envoi de 3 déclarations… » · « Connexion rétablie. »
- **Accord** : tous les compteurs s'accordent au pluriel (« 1 déclaration », « 3 déclarations »).
