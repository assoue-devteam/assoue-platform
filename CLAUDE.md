# CLAUDE.md — AS'Soué Platform

## Contexte du projet

AS'Soué est une plateforme réelle pour une entreprise sociale burkinabè, construite autour de trois piliers : collecte tracée de déchets (plastique/pneus), formation aux métiers verts, et vente de produits valorisés (mobilier, bijoux, chaussures, accessoires). Stack : Spring Boot 3.3.x (Java 21) en monolithe modulaire côté backend, Angular 18 côté frontend, PostgreSQL, JWT pour l'auth.

**Portée pour la livraison actuelle (4 semaines, 4 développeurs) :** Auth, Commerce (catalogue + commande + paiement via PayDunya), Collecte (y compris mode hors-ligne), Stock. Le pilier Formation est **explicitement hors scope de code** pour cette itération — modélisé (entités JPA, UML) mais pas implémenté. Si une tâche semble en avoir besoin, signale-le au lieu de l'implémenter silencieusement ; l'équipe a peut-être tranché différemment depuis.

## Commandes

Infra locale (Postgres + Adminer) :
```bash
cp .env.example .env   # une fois, valeurs réelles jamais commitées
docker compose up -d   # Adminer sur :8081
```

Backend (`cd backend`) :
```bash
./mvnw spring-boot:run                     # démarre sur :8080, Swagger sur /swagger-ui.html
./mvnw test                                # toute la suite
./mvnw test -Dtest=NomClasseTest#methode   # un seul test
./mvnw clean package                       # build du jar
```

Frontend (`cd frontend`) :
```bash
npm install
ng serve --proxy-config proxy.conf.json                 # démarre sur :4200, proxy /api vers :8080
ng test                                                  # toute la suite (Karma/Jasmine)
ng test --include='**/nom.component.spec.ts'             # un seul fichier de test
ng build
```

## Architecture

Backend : monolithe modulaire `bf.assoue.platform`, un package par pilier — `auth/`, `commerce/`, `paiement/`, `collecte/`, `stock/`, plus `common/` pour la config transverse, les exceptions et la sécurité (JWT). Chaque module suit `controller/` → `service/` → `repository/`, avec `model/` (entités JPA) et `dto/`. À ce stade, la plupart des modules ne contiennent que des `package-info.java` (squelette) ; seuls `auth/model` (`Utilisateur`, `Role`) et `common/security/SecurityConfig` ont du code réel — la config de sécurité est encore un squelette ouvert (`/api/auth/**` et Swagger en accès public, pas encore de filtre JWT branché).

Le schéma de base est piloté uniquement par Flyway (`backend/src/main/resources/db/migration/V*__*.sql`, ex. `V1__init_schema.sql`) — `ddl-auto: validate`, jamais `update`/`create`. Chaque évolution de schéma est une nouvelle migration `V{n+1}__...`, jamais une modification d'un fichier déjà mergé.

Frontend : Angular 18 en standalone components (pas de `NgModule`, voir `app.config.ts`/`app.routes.ts`), structure feature-based sous `src/app/` — `core/` (services singleton, guards, intercepteurs HTTP), `shared/` (composants/pipes réutilisables), `features/{auth,catalogue,commande,collecte,admin}/`. L'URL de l'API vient de `src/environments/environment.ts` (`apiUrl`), et `proxy.conf.json` évite CORS en dev.

Le pilier Formation (`Formation`, `ModuleFormation`, `Inscription`, `Certification`, `Equipement`) est modélisé dans `docs/domaine-metier.md` mais n'a aucun package/dossier correspondant en code — normal, voir portée ci-dessus.

## Où trouver quoi

- `.claude/rules/backend.md` et `.claude/rules/frontend.md` — conventions détaillées par pile technique, se chargent automatiquement selon les fichiers touchés. Ne les duplique pas ici.
- `docs/domaine-metier.md` — glossaire et modèle de classes. À lire avec l'outil Read avant de créer ou nommer une entité, un champ, une relation.
- `docs/user-stories.md` — critères d'acceptation Gherkin US-01 à US-05. Une fonctionnalité n'est finie que quand ces critères passent, pas juste quand le code compile.
- `docs/api-contract.md` — contrat d'API de référence entre frontend et backend.

## Comportement attendu

**Mode plan obligatoire** avant toute modification touchant `paiement/`, `auth/`, ou la synchronisation offline de `collecte/` — décris ton plan avant d'éditer, n'implémente pas directement.

Avant de modifier un fichier, regarde son contexte — fichiers voisins, tests existants, contrat d'API si l'endpoint est déjà défini. N'invente jamais une dépendance, une méthode ou un endpoint qui n'existe pas dans le repo ou dans les librairies déclarées (`pom.xml` / `package.json`) — si tu n'es pas sûr qu'une API existe, dis-le plutôt que de la fabriquer.

Pour une tâche simple et évidente (fix localisé, renommage, ajout d'un champ), agis directement. Pour une tâche qui touche plusieurs fichiers ou modules, propose d'abord un plan bref.

Ne réécris pas un fichier existant en entier quand une modification ciblée suffit. Ne supprime pas de code parce que tu ne comprends pas immédiatement son rôle — cherche son usage ailleurs dans le repo d'abord, ou demande.

Committe par petites unités logiques avec des messages Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`). Ne laisse jamais de travail non commité en fin de session — règle numéro un de ce projet (risque R6 du CDC, criticité la plus haute identifiée).

Avant de committer un changement sur `paiement/` ou `auth/`, signale-le explicitement dans ton résumé de fin de tâche — revue humaine systématique sur ces zones, pas seulement recommandée.

Si une tâche nécessite une décision d'architecture non documentée ici (ex. quel fournisseur pour tel cas, comment modéliser une relation non tranchée), arrête-toi et demande plutôt que de trancher seul.

N'ajoute et ne supprime aucun serveur MCP ou skill sans le demander — la configuration outillage est décidée par le chef de projet.

## Style de code — éviter le "code généré par IA"

Pas de noms de variables artificiels ni de sur-explication. Pas de structure de dossiers surdimensionnée pour la taille réelle du projet. Le code doit ressembler à ce qu'écrirait une équipe pressée par le temps, pas à une démonstration de patterns. Si une solution simple à 10 lignes fait le travail, ne la remplace pas par une abstraction à 40 lignes "pour la maintenabilité future" — horizon du projet : 4 semaines, pas 4 ans.

Pas de commentaire qui répète ce que la ligne fait déjà — commente le pourquoi, pas le quoi.
