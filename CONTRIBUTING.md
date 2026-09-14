# Contribuer au projet AS'Soué

## Convention de commit

On suit [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` — nouvelle fonctionnalité
- `fix:` — correction de bug
- `chore:` — tâche technique sans impact fonctionnel (config, dépendances…)
- `docs:` — documentation uniquement
- `refactor:` — changement de code sans changement de comportement
- `test:` — ajout ou modification de tests

Exemple : `feat(auth): ajoute l'endpoint de login JWT`

Scope recommandé entre parenthèses : `auth`, `commerce`, `paiement`, `collecte`, `stock`, `frontend`, `infra`.

## Règle R6 — commit et push réguliers

Risque identifié dans l'analyse de risques du CDC (R6, criticité la plus haute) : **commit + push toutes les 2h minimum**. Jamais de travail non poussé en fin de journée. Un poste qui plante ou un disque qui lâche ne doit jamais faire perdre plus de deux heures de travail à qui que ce soit sur ce projet.

## Branches

- `main` — toujours déployable, protégée (PR obligatoire, 1 review minimum, pas de push direct)
- `develop` — branche d'intégration, c'est là que les PR atterrissent
- `feature/<lot>-<description>` — ex. `feature/auth-jwt`, `feature/collecte-offline-sync`, `feature/paiement-paydunya`

Fusion dans `main` uniquement aux jalons (fin de semaine ou fin de fonctionnalité stable).

## Pull requests

- Titre clair, au format Conventional Commits
- Lien vers le ticket Trello / GitHub Projects correspondant
- Checklist avant de demander une review :
  - [ ] Tests passés localement
  - [ ] Pas de secret commité (clé API, mot de passe, `.env`)
  - [ ] Revu par un pair
- Garder la PR petite (idéalement < 400 lignes) pour rester revuable rapidement à 4 personnes

## Zones sensibles

Toute PR touchant à l'authentification ou au paiement (PayDunya) mérite une relecture humaine systématique, même si les tests passent — voir `AGENTS.md` pour le détail des règles de sécurité attendues sur ces modules.
