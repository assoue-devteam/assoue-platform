# Démarrage local — AS'Soué Platform

Guide d'exécution au quotidien. La conception du projet vit dans `docs/` (`guide-initialisation-projet-assoue.md` = historique du scaffolding, pas une procédure). **Ici, `cmd.exe` en premier** : les commandes `./mvnw` et `source .env` sont du bash et échouent en CMD.

## 1. Prérequis (une fois)

- Java 21 (JDK) · Node.js 20+ (`node --version`) · Docker Desktop **démarré** · Git
- `JAVA_HOME` défini (sinon `mvnw.cmd` échoue avec « JAVA_HOME not found ») : `setx JAVA_HOME "C:\Program Files\Java\jdk-21.0.10"` (adapter au chemin réel), puis rouvrir le terminal
- Une fois à la racine du repo :
  ```cmd
  copy .env.example .env
  ```
  Puis renseigne les vraies valeurs (demande à l'équipe). `.env` est ignoré par Git : **jamais commité**.

## 2. Premier démarrage

```cmd
docker compose up -d
docker ps
```
Attendus : `assoue-db` (healthy, port `POSTGRES_PORT` du `.env`, 5433 chez nous), `assoue-adminer` (:8081), `assoue-backend` (:8080).

Base vide au premier lancement ? Normal : Flyway crée le schéma + les rôles, pas de données métier. Injecte le seed **dev uniquement** :
```cmd
docker exec -i assoue-db psql -U assoue -d assoue_db < seed_demo_dev.sql
```
Contenu : 3 comptes (mot de passe `Password123!`), 7 produits + stocks, 2 matériaux (`Plastique`, `Pneu`), 2 collectes de démo. Rejouable sans doublon. **Ne jamais en faire une migration Flyway** (partirait en production).

### Catalogue 2026 (24 produits)

Le catalogue 2026 (PDF `docs/Catalogue 2026.pdf`, visuels `seed-assets/catalogue-2026/`) est injecté par `scripts/seed_catalogue_2026.mjs` — **pas de SQL brut** : le script passe par l'API admin (`POST /api/images` puis `POST /api/produits`, stock initial via `creerStockInitial`).

Prérequis : backend Docker démarré (la migration `V21__categories_catalogue_2026.sql` crée les 3 catégories `Maison et jardin`, `Vêtements`, `Décoration et maison` au démarrage).

```bash
node scripts/seed_catalogue_2026.mjs
```

- **Idempotent** : un produit dont le nom existe déjà n'est ni recréé ni écrasé (modifications admin préservées) ; les produits actifs absents du catalogue 2026 sont archivés (suppression logique).
- **Dev uniquement** : le script refuse de tourner si l'API n'est pas `localhost`/`127.0.0.1`.
- **Images** : 1 par produit (la plus grande de son groupe, objet seul, jamais agrandie) ; les doublons `chaussures-pneus-01/07` et `06/08` sont évités (image `05` utilisée).
- **Prix provisoires** (FCFA, à valider par l'admin) : Guéridon 25000, Poubelle 20000, Pot de culture 12000, Pot de fleurs 5000, Pouf 12000, Chaise haute 18000, Pouf deux en un 18000, Mini salon 2pl 85000, Salon 4pl 150000, Salon 7pl 300000, Bureau 120000, Sandales 8000, Bracelet 2500, Pull-over 15000, Ensemble enfant 12000, Sac à main 15000, Sac à dos 10000, Éventail-ceinture 6000, Couverture carnet 3000, Drap 25000, Tableaux 15000, Boîtes à mouchoirs 4000, Housses voiture 45000, Décoration restaurant 20000.

## 3. Démarrage quotidien

Terminal 1 — backend, base et Adminer (Docker) :
```cmd
docker compose up -d
```
`backend/src` est monté dans le conteneur : une modif Java redémarre l'appli toute seule (devtools). Après une modif du `pom.xml` ou du `Dockerfile`, rebuild : `docker compose up -d --build backend`. Logs : `docker logs -f assoue-backend`.
Vérifier : `http://localhost:8080/swagger-ui.html` et `curl http://localhost:8080/api/produits` (ou `http://localhost:8080/api/produits` dans le navigateur). Le premier démarrage compile le projet dans le conteneur : compter 1 à 2 minutes.

> Alternative sans Docker pour le backend : `backend\run-local.cmd`. Il charge le `.env`, active le profil `dev`, pointe la base sur `POSTGRES_PORT` et arrête le conteneur `assoue-backend` qui occupe le port 8080. Prérequis : `JAVA_HOME` défini (voir §1). Retour à Docker : `docker start assoue-backend`.

Terminal 2 — frontend, depuis la racine du repo (si l'invite finit déjà par `rontend>`, saute le `cd`) :
```cmd
cd frontend
npm ci        :: seulement au premier lancement ou après un changement de package-lock.json, avec ng serve arrêté
npx ng serve --proxy-config proxy.conf.json
```
Vérifier : `http://localhost:4200` (le `/api` est proxifié vers `:8080`, pas de CORS).

Terminal 3 — tunnel (partage avec l'équipe, optionnel) :
```cmd
npx localtunnel --port 4200 --subdomain assoue
```
URL fixe de l'équipe : **`https://assoue.loca.lt`**
Garder ce terminal ouvert tant que le partage est actif.
> Les coéquipiers devront entrer l'adresse IP de ta connexion internet (indiquée sur la page d'accueil) lors de leur première connexion pour des raisons de sécurité.

Adminer (inspecter la base) : `http://localhost:8081` — serveur `db`, identifiants du `.env`.

## 4. Comptes de test (dev local uniquement)

| Email | Mot de passe | Rôle | Espace |
|---|---|---|---|
| `admin@assoue.bf` | `Password123!` | ADMIN | `http://localhost:4200/gestion` |
| `client@assoue.bf` | `Password123!` | CLIENT | boutique `/` |
| `collecteur@assoue.bf` | `Password123!` | COLLECTEUR | `http://localhost:4200/collecte` |

- L'inscription publique (`/inscription`) crée toujours un **CLIENT**.
- Créer un COLLECTEUR/ADMIN : connecté en admin → **Gestion → Utilisateurs → « Nouvel utilisateur »** (rôle au choix). Jamais via l'inscription publique.
- Compte bloqué (423 après 3 échecs) : l'admin le débloque depuis la même page.

## 5. Commandes utiles

```cmd
cd backend
mvnw.cmd -B test            :: unitaires (rapide, sans Docker)
mvnw.cmd -B test -Dtest="AuthServiceTransactionIT,PaiementInitiationConcurrenceIT" -DfailIfNoTests=false  :: tests d'intégration (Docker requis)
```
> Les `*IT` sont exclus du `test` par défaut (convention Spring Boot) : la CI actuelle ne les exécute pas non plus — à corriger avec Failsafe + `verify`.

```cmd
cd frontend
npm run test:ci                                         :: 37 TU (Karma/Jasmine)
npm run build -- --configuration production             :: build prod
npm audit --omit=dev --audit-level=high                 :: gate release : doit rester à 0
npx playwright install --with-deps chromium
npm run e2e                                             :: E2E (serveur dev requis)
```

## 6. Antisèche commit + push (CMD)

Branche de travail actuelle : `feature/v1-stabilisation`. Convention : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

```cmd
git status --short
git diff --stat
git add <chemin-fichier-1> <chemin-fichier-2>
git commit -m "fix(paiement): message explicite"
git push
```

Règles : un commit = une unité logique, petits commits (< 400 lignes par PR), **jamais de commit sur `main`/`develop`** — PR vers `develop`, 1 review minimum. Revue humaine systématique avant merge si `paiement/` ou `auth/` touchés. Rien ne reste non poussé en fin de journée (risque R6).

Renommer / changer de branche :
```cmd
git branch -m ancien-nom feature/nouveau-nom
git push -u origin feature/nouveau-nom
git push origin --delete ancien-nom
```

## 7. Dépannage (déjà rencontrés)

| Symptôme | Cause | Fix |
|---|---|---|
| `'.' n'est pas reconnu...` | `./mvnw` tapé en CMD | `mvnw.cmd` (sans `./`) |
| `La variable d'environnement -a; ...` | `source .env` en CMD | inutile : `docker compose` charge `.env` seul |
| API `[]` sur produits/catégories | base fraîche, pas de seed | §2 `seed_demo_dev.sql` |
| Login `423` en boucle | hash dev invalide ou 3 échecs | relance le seed (reset mdp + compteur) ou débloque en admin |
| Page blanche après rebuild | vieux service worker en cache | DevTools → Application → Service Workers → Unregister + `Ctrl+Maj+R` (SW réservé à la prod depuis le fix) |
| Badge « En ligne » alors que l'API est coupée | corrigé : l'intercepteur constate la panne (statut 0) | mettre à jour (`git pull`) |
| `npm ci` : `EPERM: operation not permitted, unlink ...esbuild.exe` | un `ng serve` tourne encore et verrouille `node_modules` | `Ctrl+C` dans le terminal du `ng serve` (ou fermer l'autre terminal), puis relancer `npm ci` |
| `Could not find the '@angular-devkit/build-angular:dev-server' builder` | `node_modules` incomplet (un `npm ci` a échoué en route) | relancer `npm ci` jusqu'au bout, puis `ng serve` |
| `cd frontend` : `Le chemin d'accès spécifié est introuvable` | déjà dans `frontend` | rien à faire, passer à la commande suivante |
| `package-lock.json` modifié après `npm install` | utiliser `npm ci` | `git checkout -- frontend/package-lock.json` puis `npm ci` |
| Conteneur backend sans tes derniers changements de dépendances | image construite avant la modif du `pom.xml` | `docker compose up -d --build backend` |
| `conventionErrorViewResolver` déjà défini, le backend redémarre en boucle | springdoc 3.x (fait pour Spring Boot 4) dans le `pom.xml` | garder springdoc 2.8.x tant qu'on est en Spring Boot 3, puis `docker compose up -d --build backend` |
| `JAVA_HOME not found in your environment` | `JAVA_HOME` non défini | §1 `setx JAVA_HOME ...` puis rouvrir le terminal |
| `Could not resolve placeholder 'jwt.expiration-ms'` | aucun profil Spring actif | lancer le backend local avec `backend\run-local.cmd` (§3), pas `mvnw.cmd` seul |
| Docker `npipe ... daemon is running` | Docker Desktop éteint | le démarrer, puis `docker compose up -d` |
