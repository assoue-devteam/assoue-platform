# Démarrage local — AS'Soué Platform

Guide d'exécution au quotidien. La conception du projet vit dans `docs/` (`guide-initialisation-projet-assoue.md` = historique du scaffolding, pas une procédure). **Ici, `cmd.exe` en premier** : les commandes `./mvnw` et `source .env` sont du bash et échouent en CMD.

## 1. Prérequis (une fois)

- Java 21 (JDK) · Node.js 20+ (`node --version`) · Docker Desktop **démarré** · Git
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
Attendus : `assoue-db` (healthy, :5432), `assoue-adminer` (:8081), `assoue-backend` (:8080).

Base vide au premier lancement ? Normal : Flyway crée le schéma + les rôles, pas de données métier. Injecte le seed **dev uniquement** :
```cmd
docker exec -i assoue-db psql -U assoue -d assoue_db < seed_demo_dev.sql
```
Contenu : 3 comptes (mot de passe `Password123!`), 7 produits + stocks, 2 matériaux (`Plastique`, `Pneu`), 2 collectes de démo. Rejouable sans doublon. **Ne jamais en faire une migration Flyway** (partirait en production).

## 3. Démarrage quotidien

Terminal 1 — backend (tourne aussi dans Docker, mais en local on garde le hot-reload) :
```cmd
cd backend
mvnw.cmd spring-boot:run
```
Vérifier : `http://localhost:8080/swagger-ui.html` et `curl http://localhost:8080/api/produits` (ou `http://localhost:8080/api/produits` dans le navigateur).

> Si le port 8080 est pris par le conteneur `assoue-backend` : `docker stop assoue-backend` (ou travaille directement contre le conteneur, mais rebuild après chaque modif Java : `docker compose up -d --build backend`).

Terminal 2 — frontend :
```cmd
cd frontend
npm ci
npx ng serve --proxy-config proxy.conf.json
```
Vérifier : `http://localhost:4200` (le `/api` est proxifié vers `:8080`, pas de CORS).

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
| `package-lock.json` modifié après `npm install` | utiliser `npm ci` | `git checkout -- frontend/package-lock.json` puis `npm ci` |
| Conteneur backend sans tes derniers changements Java | image construite avant | `docker compose up -d --build backend` |
| Docker `npipe ... daemon is running` | Docker Desktop éteint | le démarrer, puis `docker compose up -d` |
