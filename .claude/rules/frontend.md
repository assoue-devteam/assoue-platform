---
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.html"
  - "frontend/**/*.scss"
---

# Conventions frontend — Angular

Structure feature-based : `core/` (services singleton, guards, intercepteurs JWT), `shared/` (composants réutilisables, pipes, modèles TS communs), `features/<pilier>/` (auth, catalogue, commande, collecte, admin — pas de dossier `formation/` cette itération).

Le contrat d'API (`docs/api-contract.md`) est la source de vérité sur les formats JSON et codes d'erreur — ne devine pas un format de réponse, vérifie-le là ou dans le code backend correspondant avant d'écrire un service Angular qui le consomme.

**Espace collecteur (offline-first).** C'est le module le plus sensible du frontend. Une déclaration de collecte doit s'enregistrer immédiatement en local (IndexedDB) et confirmer au collecteur sans attendre de réponse réseau. La synchronisation au retour de connexion doit être idempotente — un même lot de collectes ne doit jamais créer de doublon en base même si la synchronisation est déclenchée deux fois (coupure réseau pendant l'envoi, par exemple).

**Formulaires de paiement.** N'implémente jamais de logique qui redirige ou affiche une confirmation de paiement sans que le backend ait confirmé un statut "payé" — l'UI ne doit jamais anticiper une confirmation sur la base d'une simple absence d'erreur réseau.

**Performance.** Le catalogue doit rester utilisable sur 3G — évite de charger des images non optimisées ou des listes non paginées sur les vues catalogue et panier.

Pas de composant ou service pour le pilier Formation cette itération — si une tâche semble en avoir besoin, signale-le avant d'implémenter.
