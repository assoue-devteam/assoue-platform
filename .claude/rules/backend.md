---
paths:
  - "backend/**/*.java"
  - "backend/**/*.yml"
  - "backend/**/*.sql"
---

# Conventions backend — Spring Boot

Chaque domaine métier (`auth`, `commerce`, `paiement`, `collecte`, `stock`) est un package isolé avec sa structure `controller/service/repository/model/dto`. Pas de dépendance directe entre packages métier — si `commerce` a besoin de `stock`, ça passe par un service, jamais par un accès direct au repository d'un autre module.

Logique métier dans les services, jamais dans les entités JPA. Une entité porte des données, un service porte des règles.

Un stock ne descend jamais sous zéro — gère l'échec de transaction proprement plutôt que de laisser passer une valeur négative. Une commande ne peut pas être créée sans au moins une ligne de commande (`LigneCommande`, multiplicité 1..\*) — refuse-le au niveau service, pas seulement en validation de façade.

**Paiement (PayDunya).** Un paiement passe toujours par un statut intermédiaire ("en attente") avant "payé". Ne valide jamais une commande sur la simple absence de réponse du fournisseur — vérifie le statut réel via l'API PayDunya avant toute confirmation, jamais uniquement sur réception (ou absence) de webhook.

**Sécurité.** Mots de passe hachés bcrypt. Blocage après 3 tentatives de connexion échouées. Aucun secret en dur — tout passe par variables d'environnement (`application-dev.yml` référence `${VAR}`, jamais de valeur littérale).

**Migrations Flyway.** Un fichier `V2__...`, `V3__...` par évolution de schéma — jamais de modification d'un fichier déjà mergé sur `develop`.

**Tests.** Toute règle métier non triviale (calcul de stock, validation de paiement, synchronisation offline) a un test qui la couvre.

Pas de module `formation/` cette itération — si une tâche semble en avoir besoin, signale-le, le scope a peut-être changé depuis.
