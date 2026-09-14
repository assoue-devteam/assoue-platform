# AGENTS.md — AS'Soué Platform

Ce fichier guide tout agent de codage (OpenCode ou autre) travaillant sur ce repo. Lis-le avant toute modification. Il n'est pas décoratif — les règles ci-dessous existent parce qu'on les a déjà vues casser des choses.

## Contexte du projet

AS'Soué est une plateforme réelle pour une entreprise sociale burkinabè, construite autour de trois piliers : collecte tracée de déchets (plastique/pneus), formation aux métiers verts, et vente de produits valorisés (mobilier, bijoux, chaussures, accessoires). Stack : Spring Boot 3.3.x (Java 21) en monolithe modulaire côté backend, Angular 18 côté frontend, PostgreSQL, JWT pour l'auth.

**Portée pour la livraison actuelle (4 semaines, 4 développeurs) :** Auth, Commerce (catalogue + commande + paiement), Collecte (y compris mode hors-ligne), Stock. Le pilier Formation est **explicitement hors scope de code** pour cette itération — modélisé (entités JPA, UML) mais pas implémenté. Si tu tombes sur une tâche liée à Formation, signale-le au lieu de l'implémenter silencieusement ; l'équipe a peut-être tranché différemment depuis.

## Règles de développement

**Architecture.** Chaque domaine métier (`auth`, `commerce`, `paiement`, `collecte`, `stock`) est un package isolé avec sa propre structure `controller/service/repository/model/dto`. Ne fais pas fuir de la logique métier dans les entités JPA — les entités portent des données, les services portent des règles. Ne crée pas de dépendance directe entre packages métier ; si `commerce` a besoin de `stock`, ça passe par un service, jamais par un accès direct au repository d'un autre module.

**Qualité de code.** Pas de commentaire qui répète ce que la ligne fait déjà — commente le pourquoi, pas le quoi. Pas d'abstraction "au cas où" pour une fonctionnalité à une seule implémentation. Une commande créée sans ligne de commande n'a pas de sens métier : refuse-le au niveau service, pas seulement en validation de façade. Un stock ne descend jamais sous zéro — gère l'échec de transaction proprement plutôt que de laisser une valeur négative passer.

**Sécurité.** Mots de passe hachés bcrypt, jamais en clair, jamais loggués. Blocage après 3 tentatives de connexion échouées. Aucune clé API, aucun secret, aucun identifiant de base ne doit apparaître en dur dans le code — tout passe par variables d'environnement. Si tu écris ou modifies un endpoint qui touche à l'authentification ou aux paiements, indique-le clairement dans ton résumé de fin de tâche — ces zones méritent une relecture humaine systématique.

**Paiement mobile.** Le fournisseur retenu pour le MVP est **PayDunya**, en agrégateur unique couvrant à la fois Orange Money Burkina et Moov Burkina Faso via une seule intégration — ne code pas d'appel direct aux API Orange Money ou Moov, tout passe par PayDunya. Un paiement passe toujours par un statut intermédiaire ("en attente") avant d'être marqué "payé". Ne valide jamais une commande sur la simple absence de réponse du fournisseur — en cas de coupure réseau, le statut réel doit être vérifié via l'API de statut de PayDunya avant toute confirmation, jamais sur la seule réception (ou absence) du webhook. Voir `docs/api-contract.md` pour le contrat exact avant de toucher aux endpoints de paiement. Le compte marchand PayDunya (KYC : RCCM, pièce d'identité du représentant légal, RIB) est une dépendance administrative externe au code — si tu bloques sur une clé API ou un accès sandbox manquant, signale-le, ne mocke pas silencieusement une intégration qui doit rester réelle.

**Mode hors-ligne (Collecte).** La synchronisation doit être idempotente — une resynchronisation en double ne doit jamais créer une deuxième entrée pour la même collecte. Le verrou anti-doublon n'est pas optionnel, c'est un critère d'acceptation testé.

**Tests.** Toute nouvelle règle métier non triviale (calcul de stock, validation de paiement, synchronisation offline) a un test qui la couvre. Pas besoin de viser 100 % de couverture partout — vise les chemins qui font mal s'ils cassent.

## Contexte métier — où trouver quoi

Ne relis pas le CDC entier pour une tâche courante — ces deux fichiers ciblés suffisent dans la grande majorité des cas :

- `docs/domaine-metier.md` — glossaire et modèle de classes par pilier. Consulte-le avant de créer ou nommer une entité, un champ, ou une relation, pour rester cohérent avec le vocabulaire déjà validé (Dépôt vs Point de collecte, Créateur vs Artisan, etc.).
- `docs/user-stories.md` — les critères d'acceptation Gherkin US-01 à US-05. Une fonctionnalité n'est finie que quand ces critères passent, pas juste quand le code compile.

## Comportement attendu de l'agent

Avant de modifier un fichier, regarde son contexte — les fichiers voisins, les tests existants, `docs/api-contract.md` si l'endpoint est déjà défini côté contrat. N'invente jamais une dépendance, une méthode ou un endpoint qui n'existe pas dans le repo ou dans les librairies déclarées dans le `pom.xml` / `package.json` — si tu n'es pas sûr qu'une API existe, dis-le plutôt que de la fabriquer.

Pour une tâche simple et évidente (fix de bug localisé, renommage, ajout d'un champ), agis directement. Pour une tâche qui touche plusieurs fichiers ou plusieurs modules, propose d'abord un plan bref avant d'implémenter.

Ne réécris pas un fichier existant en entier quand une modification ciblée suffit. Ne supprime pas de code parce que tu ne comprends pas immédiatement son rôle — demande, ou cherche son usage ailleurs dans le repo d'abord.

Committe par petites unités logiques avec des messages Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`). Ne laisse jamais de travail non commité en fin de session — c'est la règle numéro un de ce projet, voir `CONTRIBUTING.md` pour le pourquoi (risque R6 du CDC, criticité la plus haute identifiée sur ce projet).

Si une tâche te semble nécessiter une décision d'architecture non documentée ici (par exemple : quel fournisseur de paiement pour le MVP, comment modéliser la relation Depot/Collecte), arrête-toi et demande plutôt que de trancher seul.

## Style de code — éviter le "code généré par IA"

Pas de noms de variables artificiels ou de sur-explication. Pas de structure de dossiers surdimensionnée pour la taille réelle du projet. Le code doit ressembler à ce qu'écrirait une équipe de développeurs compétents pressés par le temps, pas à une démonstration de patterns. Si une solution simple à 10 lignes fait le travail, ne la remplace pas par une abstraction à 40 lignes "pour la maintenabilité future" — ce projet a un horizon de 4 semaines, pas de 4 ans.

## Modèles à utiliser selon la tâche

Par défaut, le modèle configuré (DeepSeek V4 Pro) convient pour tout le travail de code courant. Pour les tâches suivantes, utilise l'agent `spike` (configuré sur Claude Sonnet 5) car elles concentrent le risque du projet : intégration du fournisseur de paiement mobile, synchronisation offline de la Collecte, toute décision de sécurité touchant à l'authentification.
