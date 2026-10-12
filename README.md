# AS'Soué Platform

Plateforme numérique pour AS'Soué, entreprise sociale burkinabè qui transforme déchets plastiques et pneus usagés en mobilier, bijoux et accessoires.

![Build](https://img.shields.io/badge/build-en%20d%C3%A9veloppement-yellow)
![Backend](https://img.shields.io/badge/backend-Spring%20Boot%203.3-brightgreen)
![Frontend](https://img.shields.io/badge/frontend-Angular%2020-red)
![License](https://img.shields.io/badge/license-MIT-blue)

## Description

AS'Soué connecte trois activités : la collecte tracée de déchets plastiques et pneus par un réseau de collecteurs de terrain, la vente en ligne de produits recyclés (mobilier, bijoux, chaussures, accessoires), et un volet formation aux métiers verts pour les artisans transformateurs. La plateforme doit rester utilisable sur des connexions 3G instables et sur des smartphones Android d'entrée de gamme, avec un module de collecte fonctionnel même hors ligne.

*(Capture d'écran / démo à ajouter ici une fois la version bêta disponible.)*

## Prérequis et installation

Prérequis :
- Java 21 (JDK)
- Node.js 20+
- Docker Desktop **démarré**
- PostgreSQL 16 (fourni via Docker Compose, pas d'installation séparée nécessaire)

Installation et démarrage au quotidien : voir [`docs/demarrage-local.md`](./docs/demarrage-local.md) (procédure complète, antisèche CMD, comptes de test, dépannage).

Résumé :
```bash
copy .env.example .env   # puis renseigner les vraies valeurs (demander à l'équipe)
docker compose up -d
docker exec -i assoue-db psql -U assoue -d assoue_db < seed_demo_dev.sql   # données de démo (dev uniquement)
```

Backend : lancé par `docker compose up -d` ci-dessus (hot reload sur `backend/src`, `docker compose up -d --build backend` après une modif du `pom.xml`). Sans Docker : `backend\run-local.cmd` (Windows), détails dans `docs/demarrage-local.md`.
Vérifier : `http://localhost:8080/swagger-ui.html` et `http://localhost:8080/api/produits`

Frontend (`cd frontend`) :
```bash
npm ci
ng serve --proxy-config proxy.conf.json
```
Vérifier : `http://localhost:4200`

Comptes de démo (base seedée, mot de passe dans `docs/demarrage-local.md`) : `admin@assoue.bf` (ADMIN → `/gestion`), `client@assoue.bf` (CLIENT → boutique), `collecteur@assoue.bf` (COLLECTEUR → `/collecte`). L'inscription publique crée toujours un CLIENT ; les rôles COLLECTEUR/ADMIN se créent via **Gestion → Utilisateurs**.

## Images uploadées

Les photos produits/événements sont envoyées par l'admin (`POST /api/images`, JPEG/PNG, 10 Mo au plus : le navigateur réduit à 2000 px en JPEG 0,85 avec l'orientation EXIF, le serveur normalise et réencode à 1600 px) et stockées sur disque :
- en dev : `./uploads` (créé par le dépôt, `ASSOUE_IMAGES_DIR` relatif accepté) ;
- en production : `ASSOUE_IMAGES_DIR` **absolu et obligatoire** (ex. `/var/lib/assoue/uploads`), avec un **volume monté** sur ce chemin — sinon le backend refuse de démarrer, et sur disque éphémère les images seraient perdues à chaque redéploiement (le passage au stockage objet se fera derrière la même interface `StockageImage`, voir contrat d'API).
- `docker compose` monte déjà `./uploads:/app/uploads` avec `ASSOUE_IMAGES_DIR=/app/uploads`.
- Mémoire : le serveur décode au plus 50 M pixels (photo 48 MP ≈ 150 Mo transitoires) et traite **2 uploads en parallèle au plus** (sémaphore, 3e refusé en `429 « Réessayez dans un instant »`), soit ~300 Mo transitoires. Sur un VPS 2 Go (OS + Postgres + backend), lancer avec `-Xmx1g` (voir `JAVA_OPTS` dans `docker-compose.yml`) : 1 Go de tas absorbe les 2 décodages + le reste de l'appli, le Go restant va à Postgres et au système.

## Envoi d'e-mails

Le backend envoie des e-mails (mot de passe oublié, alertes métier) via SMTP, de façon asynchrone : un échec d'envoi ne bloque jamais la transaction métier qui l'a déclenché. Configuration via les variables `ASSOUE_MAIL_*` (voir `.env.example`) :

- `ASSOUE_MAIL_HOST`, `ASSOUE_MAIL_PORT`, `ASSOUE_MAIL_PROTOCOL` — serveur SMTP ;
- `ASSOUE_MAIL_USERNAME`, `ASSOUE_MAIL_PASSWORD` — authentification (vide = non authentifié) ;
- `ASSOUE_MAIL_FROM` — adresse d'expédition ;
- `ASSOUE_MAIL_ALERTES_DESTINATAIRES` — une ou plusieurs adresses (séparées par des virgules) recevant les alertes métier (collecte déclarée, signalement).

Sans configuration SMTP, les envois échouent silencieusement (journalisation, aucune erreur métier). En production, renseignez un SMTP réel.

## Vérifications qualité

Depuis `backend` :

```bash
./mvnw -B test   # 46 unitaires ; les *IT s'exécutent via -Dtest="...IT" (Docker requis)
```

Depuis `frontend` :

```bash
npm run test:ci
npm run build -- --configuration production
npx playwright install --with-deps chromium
npm run e2e
npm audit --omit=dev --audit-level=high
```

Le frontend utilise Angular 20 et Playwright pour les E2E. `npm audit` (prod comme dev) est à 0 vulnérabilité : les failles de l'outillage (webpack-dev-middleware, uuid) sont neutralisées par `overrides` ciblés dans `package.json`, sans monter de version majeure. Le backend suit la ligne Spring Boot 3.3.x en patch à jour.
Budgets CSS (`angular.json`, `anyComponentStyle` 4 kB alerte / 6 kB erreur — JSON sans commentaire possible) : les styles sont inline par composant (pas de feuille globale) et 5 écrans riches (header boutique, catalogue, impact, gestion, formulaires) dépassent légitimement 2 kB.

Le backend utilise `SPRING_PROFILES_ACTIVE=prod` en production. Ce profil impose la validation du schéma par Flyway, désactive Swagger et masque les valeurs SQL. Les secrets `JWT_SECRET` et PayDunya doivent être fournis par l'environnement de déploiement. La checklist complète est dans [`docs/release-checklist.md`](./docs/release-checklist.md).

## Utilisation et exemples

Lister le catalogue de produits :
```bash
curl http://localhost:8080/api/produits
```

Créer une commande :
```bash
curl -X POST http://localhost:8080/api/commandes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"lignes": [{"produitId": 1, "quantite": 2}]}'
```

Déclarer une collecte (mode terrain) :
```bash
curl -X POST http://localhost:8080/api/collectes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"materiauId": 1, "quantiteEstimee": 15.5, "localisation": {"lat": 12.3714, "lng": -1.5197}}'
```

La documentation complète des endpoints est disponible sur Swagger UI une fois le backend lancé (`/swagger-ui.html`), et le contrat d'API de référence est dans `docs/api-contract.md`.

## Guide de contribution

Convention de commit (Conventional Commits) : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:` — exemple : `feat(auth): ajoute l'endpoint de login JWT`.

Workflow : créer une branche `feature/<lot>-<description>` depuis `develop`, ouvrir une PR vers `develop` (jamais directement vers `main`), une revue par un pair minimum avant merge. PR de préférence sous 400 lignes pour rester revuable rapidement à 4.

Détails complets du workflow, de la règle de commit toutes les 2h et du format de PR dans [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Licence

MIT — voir [`LICENSE`](./LICENSE). Le code appartient à l'équipe de développement durant le projet académique et sera cédé à AS'Soué en fin de livraison.
