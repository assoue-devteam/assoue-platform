# Guide d'initialisation — Projet AS'Soué (v2)

Hypothèses retenues : Java 21 · Spring Boot 3.3.x · Angular 18 · Node 20 LTS · package de base `bf.assoue.platform` · monorepo · GitHub · Docker pour l'infra locale · OpenCode comme agent de codage.

**Décisions prises depuis la v1 de ce guide, à connaître avant de continuer :**
- Le pilier **Formation** est hors scope de code pour cette livraison (4 semaines) — modélisé mais pas implémenté. Le module `formation/` n'est donc pas généré dans cette itération.
- Fournisseur de paiement mobile tranché : **PayDunya**, en agrégateur unique (couvre Orange Money Burkina + Moov Burkina Faso via une seule intégration). Pas d'appel direct aux API Orange Money ou Moov.
- Le dépôt GitHub `assoue-platform` a déjà été créé — les étapes de création sont conservées ci-dessous pour référence mais marquées comme faites.

---

## 0. Décision structurante : monorepo

Avec 4 personnes, 4 semaines, et un besoin de coordination front/back permanent, un **monorepo** évite les allers-retours de synchronisation entre deux dépôts. Structure cible :

```
assoue-platform/
├── backend/                 # Spring Boot
├── frontend/                # Angular
├── docs/                    # CDC, diagrammes, décisions d'architecture (ADR), AGENTS.md fait référence à ces fichiers
├── AGENTS.md                # instructions pour l'agent de codage (OpenCode)
├── opencode.json             # config des modèles utilisés par OpenCode
├── docker-compose.yml        # Infra locale (Postgres, Adminer)
├── .env.example
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

---

## 1. Dépôt GitHub — ✅ déjà fait

### 1.1 Création
- Repo `assoue-platform` créé, visibilité **privée**. Si ce n'est pas déjà une organisation GitHub (`assoue-devteam` ou équivalent) plutôt qu'un compte personnel, envisage de transférer le repo dès que possible — plus simple à céder à AS'Soué en fin de projet, et tout le monde a les mêmes droits d'accès.

### 1.2 Stratégie de branches
Avec 4 personnes et 4 semaines, restez simple — pas de Git Flow complet :
- `main` — toujours déployable, protégée (pas de push direct, PR obligatoire, 1 review minimum)
- `develop` — branche d'intégration continue, c'est là que les PR atterrissent
- `feature/<lot>-<description>` — ex. `feature/auth-jwt`, `feature/collecte-offline-sync`, `feature/paiement-paydunya`
- Fusion dans `main` uniquement aux jalons (fin de semaine ou fin de fonctionnalité stable)

### 1.3 Protection de branche (Settings > Branches sur GitHub)
- `main` et `develop` : require pull request before merging, require 1 approval, require status checks to pass (une fois la CI en place)

**À faire maintenant si pas encore fait** : va dans les paramètres du repo et active cette protection — c'est deux minutes, et ça évite qu'un push direct sur `main` sous pression de deadline en semaine 4 ne casse tout sans revue.

### 1.4 Fichiers de config du repo

**`.gitignore`** (racine) :
```gitignore
# Backend (Java/Maven)
backend/target/
backend/.mvn/
*.class
*.jar

# Frontend (Angular/Node)
frontend/node_modules/
frontend/dist/
frontend/.angular/

# IDE
.idea/
*.iml
.vscode/

# Env & secrets
.env
*.env.local

# OpenCode (sessions locales, pas de secrets mais pas utile en commun)
.opencode/

# OS
.DS_Store
```

**`.env.example`** (racine — jamais de vrai secret dedans, seulement des placeholders) :
```env
POSTGRES_DB=assoue_db
POSTGRES_USER=assoue_user
POSTGRES_PASSWORD=changeme
POSTGRES_PORT=5432

SPRING_PROFILE=dev
JWT_SECRET=changeme_generate_a_real_secret

# PayDunya (fournisseur de paiement mobile retenu — agrégateur Orange Money/Moov Burkina)
PAYDUNYA_MASTER_KEY=
PAYDUNYA_PRIVATE_KEY=
PAYDUNYA_TOKEN=
PAYDUNYA_MODE=test
```

**`CONTRIBUTING.md`** — à créer avec au minimum :
- Convention de commit (Conventional Commits) : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:` — ex. `feat(auth): ajoute l'endpoint de login JWT`
- Règle issue de l'analyse de risques du CDC (R6) : **commit + push toutes les 2h minimum**, jamais de travail non poussé en fin de journée
- Format de PR : titre clair, lien vers le ticket Trello/GitHub Projects, checklist (tests passés / pas de secret commité / revu par un pair)
- Chaque PR doit être petite (idéalement < 400 lignes) pour rester revuable rapidement à 4

---

## 2. Infrastructure locale avec Docker

`docker-compose.yml` (racine du repo) :

```yaml
services:
  db:
    image: postgres:16
    container_name: assoue-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - assoue_pg_data:/var/lib/postgresql/data

  adminer:
    image: adminer
    container_name: assoue-adminer
    restart: unless-stopped
    ports:
      - "8081:8080"
    depends_on:
      - db

volumes:
  assoue_pg_data:
```

Pourquoi cette approche : Postgres + Adminer (interface web légère pour inspecter la base, plus simple que pgAdmin à faire tourner) sont conteneurisés, mais le backend et le frontend tournent en local via l'IDE pour garder le hot-reload rapide. On conteneurisera le backend plus tard pour le déploiement (semaine 4).

Commande pour démarrer l'infra :
```bash
cp .env.example .env   # puis éditer les vraies valeurs localement, jamais commité
docker compose up -d
```
Vérification : Adminer accessible sur `http://localhost:8081`, connexion avec les identifiants du `.env`.

---

## 3. Initialisation du backend (Spring Boot)

### 3.1 Génération du squelette
Via [start.spring.io](https://start.spring.io) ou l'IDE :
- **Group** : `bf.assoue`
- **Artifact** : `platform-backend`
- **Java** : 21
- **Spring Boot** : dernière version stable 3.3.x
- **Dépendances** :
  - Spring Web
  - Spring Data JPA
  - PostgreSQL Driver
  - Spring Security
  - Validation
  - Flyway Migration
  - Lombok
  - Spring Boot DevTools
  - Springdoc OpenAPI (pour la doc API — ticket semaine 4, autant l'avoir dès le départ)

Extraire dans `assoue-platform/backend/`.

### 3.2 Structure de packages (aligné sur les modules du CDC, Formation exclue de cette itération)
```
bf.assoue.platform
├── PlatformBackendApplication.java
├── common/              # config globale, exceptions, utilitaires transverses
│   ├── config/
│   ├── exception/
│   └── security/        # config Spring Security, filtres JWT
├── auth/                # Utilisateur, rôles, login/register
├── commerce/             # Categorie, Produit, Createur, Commande, LigneCommande
├── paiement/             # Paiement, intégration PayDunya, webhook de confirmation
├── collecte/              # Depot, PointCollecte, Collecte, Materiau, LigneCollecte, Compensation
└── stock/                # gestion des stocks matière première / produits finis
```
Chaque module suit en interne le même sous-découpage : `controller/`, `service/`, `repository/`, `model/` (ou `entity/`), `dto/`.

Pas de package `formation/` cette itération — si le module domaine (entités JPA, migration Flyway associée) existe déjà côté conception, il reste dans `docs/` en tant que modèle, pas en code exécuté.

### 3.3 Configuration par profil

`src/main/resources/application.yml` :
```yaml
spring:
  application:
    name: assoue-platform
  profiles:
    active: dev

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
```

`src/main/resources/application-dev.yml` :
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/assoue_db
    username: ${POSTGRES_USER}
    password: ${POSTGRES_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate   # le schéma est géré par Flyway, jamais par Hibernate en auto
    show-sql: true
  flyway:
    enabled: true

paydunya:
  mode: ${PAYDUNYA_MODE:test}
  master-key: ${PAYDUNYA_MASTER_KEY}
  private-key: ${PAYDUNYA_PRIVATE_KEY}
  token: ${PAYDUNYA_TOKEN}
```

### 3.4 Migrations Flyway
`src/main/resources/db/migration/V1__init_schema.sql` — première migration créant les tables de base (Utilisateur, rôles). Chaque évolution de schéma = un nouveau fichier `V2__...`, `V3__...`, jamais de modification d'un fichier déjà mergé sur `develop`.

### 3.5 Premier test de fumée
```bash
cd backend
./mvnw spring-boot:run
```
Vérifier `http://localhost:8080/swagger-ui.html` répond.

---

## 4. Initialisation du frontend (Angular)

### 4.1 Génération du squelette
```bash
cd assoue-platform
npx @angular/cli new frontend --routing --style=scss --strict
```

### 4.2 Structure de dossiers (feature-based, alignée sur les piliers du CDC, Formation exclue de cette itération)
```
frontend/src/app/
├── core/                 # services singleton, guards, intercepteurs HTTP (JWT)
├── shared/               # composants réutilisables, pipes, modèles TS communs
├── features/
│   ├── auth/
│   ├── catalogue/
│   ├── commande/
│   ├── collecte/
│   └── admin/
└── environments/
```

### 4.3 Configuration API + proxy dev
`src/environments/environment.ts` :
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

`proxy.conf.json` (racine de `frontend/`) pour éviter les soucis CORS en dev :
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```
Lancer avec `ng serve --proxy-config proxy.conf.json`.

### 4.4 Point de vigilance immédiat (lié au risque de planning)
Comme le backend et le frontend avancent en parallèle dès la semaine 1, définissez le **contrat d'API** (endpoints, formats JSON, codes d'erreur) sur les fonctionnalités Must Have avant que chacun code dans son coin — `docs/api-contract.md` sert exactement à ça. Le frontend peut démarrer avec des données mockées (`json-server` ou intercepteur HTTP de dev) pendant que le backend implémente réellement l'endpoint, du moment que le contrat est le même.

---

## 5. Agent de codage — OpenCode

- `AGENTS.md` à la racine du repo, lu automatiquement par OpenCode à chaque session — contient les règles de comportement, l'architecture, les garde-fous (déjà livré séparément).
- `opencode.json` à la racine, committé (sans clé) :
```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "deepseek/deepseek-v4-pro",
  "agent": {
    "spike": {
      "model": "anthropic/claude-sonnet-5"
    }
  }
}
```
- Chaque développeur configure ses propres clés API en local (`opencode auth login`), jamais commitées.
- Voir le guide de supervision séparé (`guide-supervision-opencode.md`, pour le chef de projet uniquement) pour le détail de configuration et de suivi.

---

## 6. Checklist d'onboarding — jour 1 pour chaque développeur

1. Installer : Docker Desktop, JDK 21, Node 20 LTS, OpenCode (`npm i -g opencode-ai`), IDE (IntelliJ recommandé pour le backend, VS Code pour le frontend)
2. `git clone <repo>` puis `git checkout develop`
3. `cp .env.example .env` et remplir les valeurs (demander les vrais identifiants au reste de l'équipe, jamais dans Git)
4. `docker compose up -d` → vérifier Adminer sur `:8081`
5. Backend : `cd backend && ./mvnw spring-boot:run` → vérifier Swagger sur `:8080/swagger-ui.html`
6. Frontend : `cd frontend && npm install && ng serve --proxy-config proxy.conf.json` → vérifier `:4200`
7. `opencode auth login` pour configurer sa propre clé API DeepSeek (fournie par le point de facturation unique de l'équipe)
8. Créer sa première branche `feature/...` à partir de `develop`

---

## 7. Ce qui reste à trancher (mis à jour)

Résolu depuis la v1 :
- ~~Fournisseur de paiement à intégrer en premier~~ → **PayDunya**, agrégateur unique
- ~~Formation dans le scope codé ou non~~ → **hors scope**, reportée en V1.1

Encore ouvert, à trancher avant que ça bloque un développeur :
- Relation Depot ↔ Collecte dans le modèle de données (à clarifier avant la migration V1)
- Rôles Créateur/Technicien : ont-ils besoin d'un compte utilisateur ou non
- Compte marchand PayDunya (KYC) : à qui la charge côté AS'Soué, et où en est la démarche
