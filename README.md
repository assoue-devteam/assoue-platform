# AS'Soué Platform

Plateforme numérique pour AS'Soué, entreprise sociale burkinabè qui transforme déchets plastiques et pneus usagés en mobilier, bijoux et accessoires.

![Build](https://img.shields.io/badge/build-en%20d%C3%A9veloppement-yellow)
![Backend](https://img.shields.io/badge/backend-Spring%20Boot%203.3-brightgreen)
![Frontend](https://img.shields.io/badge/frontend-Angular%2018-red)
![License](https://img.shields.io/badge/license-MIT-blue)

## Description

AS'Soué connecte trois activités : la collecte tracée de déchets plastiques et pneus par un réseau de collecteurs de terrain, la vente en ligne de produits recyclés (mobilier, bijoux, chaussures, accessoires), et un volet formation aux métiers verts pour les artisans transformateurs. La plateforme doit rester utilisable sur des connexions 3G instables et sur des smartphones Android d'entrée de gamme, avec un module de collecte fonctionnel même hors ligne.

*(Capture d'écran / démo à ajouter ici une fois la version bêta disponible.)*

## Prérequis et installation

Prérequis :
- Java 21 (JDK)
- Node.js 20 LTS
- Docker Desktop
- PostgreSQL 16 (fourni via Docker Compose, pas d'installation séparée nécessaire)

Installation :

```bash
git clone <url-du-repo>
cd assoue-platform
cp .env.example .env
# éditer .env avec les vraies valeurs (demander à l'équipe)
docker compose up -d
```

Backend :
```bash
cd backend
./mvnw spring-boot:run
```
Vérifier : `http://localhost:8080/swagger-ui.html`

Frontend :
```bash
cd frontend
npm install
ng serve --proxy-config proxy.conf.json
```
Vérifier : `http://localhost:4200`

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
