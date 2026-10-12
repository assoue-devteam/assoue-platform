# Checklist de release V1

## CI et tests

- [ ] La CI passe sur le backend avec PostgreSQL 16 et les migrations Flyway.
- [ ] Le build Angular de production, les tests unitaires et les E2E passent.
- [ ] Les tests E2E couvrent au minimum l'authentification publique, une redirection protégée et un viewport mobile.
- [ ] `npm audit --omit=dev --audit-level=high` ne signale aucune vulnérabilité haute ou critique de production.
- [ ] Une validation manuelle est faite sur Chrome Android et un écran desktop.

## Sécurité

- [ ] `JWT_SECRET` et les identifiants PayDunya proviennent du gestionnaire de secrets.
- [ ] Le profil `prod` est activé avec `SPRING_PROFILES_ACTIVE=prod`.
- [ ] Swagger et les API docs sont désactivés en production.
- [ ] Les migrations sont appliquées par Flyway; aucune migration partagée n'est modifiée.
- [ ] Les en-têtes de sécurité sont présents sur le frontend publié et les réponses API.
- [ ] Les dépendances Angular restent sur une version supportée et le lockfile est régénéré avec `npm ci`.
- [ ] Le webhook PayDunya a été validé dans le sandbox avant tout passage en live.

## Qualité produit

- [ ] Les parcours catalogue, panier, commande et paiement ont été testés avec un compte réel de test.
- [ ] Le mode hors ligne collecte, la file IndexedDB et la resynchronisation ont été vérifiés avec une connexion instable.
- [ ] Les labels, le focus clavier, les contrastes et les messages d'erreur sont vérifiés sur les écrans publics et de gestion.
- [ ] Aucun écran de la Formation n'est inclus dans le périmètre V1.

## Déploiement

- [ ] La base PostgreSQL de production est sauvegardée avant migration.
- [ ] `ASSOUE_IMAGES_DIR` est un chemin absolu avec un volume monté (sinon le backend refuse de démarrer, et les images seraient perdues au redéploiement sur disque éphémère).
- [ ] Les URLs de callback et de retour PayDunya pointent vers le domaine de production.
- [ ] Les logs et métriques de démarrage sont consultés après déploiement.
- [ ] Un rollback applicatif et la procédure de restauration de base sont connus de l'équipe.
