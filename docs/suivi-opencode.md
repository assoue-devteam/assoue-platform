# Relais de session — refonte boutique AS'SOUÉ (lots 1→5)

Fichier de relais pour continuer le travail dans le CLI opencode.
État : tout est committé, rien en suspens (règle n°1 du projet).

## Où en est le code

Branche : `feature/v1-stabilisation` (5 commits, voir `git log --oneline -5`).
Base doc : `docs/design/design-system.md` l'emporte sur tout en cas de conflit.

| Lot | Commit | Contenu |
|---|---|---|
| 1 favicon | `61eb5c8` | `favicon.ico` 16/32/48 (recadrage monogramme AS, logo 2328×864 illisible à 16 px), `apple-touch-icon`, `icon-192/512`, `index.html` + manifest à jour. Build vérifié (fichiers dans `dist/.../browser/`). |
| 2 auth | `62800b6` | `AuthLayout` (logo seul + footer 1 ligne), afficher/masquer (`eye`/`eye-off` ajoutées au registre Lucide), remember-me `localStorage`/`sessionStorage` (front-only, doc `features/auth/README.md`), 401 vague / 423 + contact / 409 sur champ email / 400 rattachée par mots-clés (GAP-11), intercepteur ignore `/api/auth/**`. Pas de « mot de passe oublié ». |
| 5 header+catalogue | `e568b44` | Header 2 rangées sticky (2e rangée repliée au scroll, `prefers-reduced-motion` OK), recherche partagée vers `/?q=` (filtre **client**, limite API notée), favoris + compteur, Mes commandes/favoris dans le menu compte. Catalogue : `q`/`categorie`/`tri` dans l'URL, tri natif, clamp 2 lignes, fallback image, « Prix sur demande », badge « Rupture de stock ». **Ratio 4:5 et conteneur 1200 px conservés (primauté DS).** |
| 4 footer | `9cc1669` | Padding 24/16, liens 14 px/32 px min, bas 13 px, souligné hover/focus, Nous-trouver en 2 blocs, réseaux en texte (`noopener noreferrer`, pas d'icônes de marques dans le registre Lucide), Mentions/CGV `[bientôt]`, grille 1/2/5 à 640/1024. |
| 3 admin produits | `3d09783` | Migration **V18** (`produit.archive`), `POST/PUT/DELETE /api/produits` (`@PreAuthorize ADMIN`), suppression **toujours logique** (jamais de 409 — un produit vendu reste lisible dans l'historique), archivés exclus du public, panier/commande refusent un archivé comme une rupture. Image URL https (même règle que événements), prix entier ≥ 0, stock absent = 0 (création) / inchangé (modif). **Pas de `POST /api/categories`** (4 catégories seedées). Page `/gestion/produits` (guard ADMIN + lien sidebar), table `.table` → cartes mobile, modale + confirmation, toasts, erreurs 400 par champ. `docs/api-contract.md` à jour. |

Lot 6 (bande d'impact) : **sauté volontairement** — aucun endpoint de chiffres dans `api-contract.md`, rien inventé.

## Décisions à retenir (ne pas re-trancher sans raison)

- Pas de Tailwind (tokens SCSS uniquement), pas de `/v1` ni d'anglais dans l'API (`/api/produits`).
- `app-gap-note` n'existe pas en Angular (réservé maquette) → texte désactivé `[bientôt]`.
- Nouveautés ≈ id décroissant (pas de date en API) ; prix `0` → `0 FCFA`.
- 401/403 des nouveaux endpoints : pas d'infra de test web dans le repo → même pattern `@PreAuthorize` + `SecurityConfig` que les endpoints admin existants, pas de MockMvc introduit.
- `scripts/` non versionné à la racine : résidu préexistant, ne pas committer.

## Reste à faire (vérifications humaines / locales)

1. `ng test` (Karma/ChromeHeadless ne démarre pas dans l'environnement actuel) et `e2e/` Playwright.
2. Captures 360 px / 1366 px : `/`, `/connexion`, `/inscription`, `/gestion/produits` (+ largeurs 1920/1440/1280/1024/768/390).
3. Checklists US-01 (mention « Rupture de stock » + ajout désactivé : OK), US-05 (décrément à la vente : inchangé ; incrément collecte : inchangé ; ajustement admin : OK via PUT), DS §13 (focus visible, 44 px, AA — revoir le ratio 4:5 sur 1080 px : 1re ligne de cartes + prix pas forcément visible, compromis DS assumé).
4. Relecture humaine obligatoire : `auth/` (session double stockage) — signalé comme demandé par `CLAUDE.md`.
5. Budget warnings `angular.json` (styles composants > 2 kB, préexistant, aggravé par catalogue/layout) : décider d'augmenter le budget ou d'alléger.

## Reprendre dans opencode CLI

```bash
cd C:\Users\hp\IdeaProjects\assoue-platform
git checkout feature/v1-stabilisation
opencode --continue   # même dossier = même session ; sinon : opencode puis coller le prompt ci-dessous
```

Prompt de reprise à coller :

> Projet AS'SOUÉ, branche feature/v1-stabilisation. Lis docs/suivi-opencode.md (relais de session),
> CLAUDE.md et docs/design/design-system.md, puis `git log --oneline -5` et `git status`.
> Les lots 1→5 sont committés, lot 6 sauté. Continue par : [décrire la suite].
> Contraintes : standalone components, tokens SCSS, ddl-auto validate (nouvelle migration Flyway),
> Conventional Commits, mode plan obligatoire pour auth/, paiement/ et sync offline collecte/.
