# Référentiel qualité V1

Ce document décrit la vérification reproductible de la phase 5.

## Frontend

Depuis `frontend` :

```bash
npm ci
npm run build -- --configuration production
npm run test:ci
npx playwright install --with-deps chromium
npm run e2e
npm audit --omit=dev --audit-level=high
```

La version Angular est verrouillée sur la ligne 20.3 et le lockfile doit toujours être commité avec `package.json`. Le build production, les 31 tests unitaires et les 3 scénarios E2E doivent être verts avant merge.

## Backend

Depuis `backend` :

```bash
./mvnw -B test
```

Les tests backend utilisent PostgreSQL et les migrations Flyway. Une migration déjà partagée ne doit jamais être modifiée : toute évolution passe par un nouveau fichier `V__...sql`.

## Sécurité et release

- Les secrets ne sont jamais commités; ils sont injectés par l'environnement.
- Le profil `prod` désactive Swagger et exige les paramètres JWT, PostgreSQL et PayDunya.
- Le webhook PayDunya reste soumis à la vérification métier et à la validation sandbox réelle.
- Les contrôles responsive et clavier sont complétés par une vérification manuelle sur mobile et desktop.
