# Domaine métier — AS'Soué

Extrait du CDC v1.0 (sections Diagramme de classes + Annexe Glossaire). Ce fichier est la référence à consulter avant de créer ou modifier une entité JPA, un DTO, ou un nom de champ — pas pour tout relire, juste pour vérifier un nom ou une relation avant de l'inventer.

## Glossaire

| Terme | Définition |
|---|---|
| Dépôt | Dépôt de déchets déclaré par le Fournisseur — pas à confondre avec Point de collecte. |
| Point de collecte | Lieu physique où s'effectue la collecte — un lieu, pas un événement. |
| Collecte | La tournée du collecteur elle-même (l'événement, mode hors-ligne), pas le lieu ni le dépôt. |
| Matériau | Le type de déchet valorisé (plastique, pneu…) — c'est la nomenclature, pas la quantité. |
| LigneCollecte | Classe d'association entre Collecte et Matériau — porte la quantité d'un matériau donné dans une tournée. |
| Compensation | Rétribution optionnelle liée à un Dépôt — optionnelle, ne pas la rendre obligatoire dans le modèle. |
| Créateur | Conçoit les modèles de produits valorisés — à cheval entre Formation et Commerce, pas un simple attribut de Produit. |
| Ligne Commande | Classe d'association entre Commande et Produit — porte la quantité achetée. Une Commande ne peut exister sans au moins une ligne : multiplicité **1..\*** et non 0..\*, ne pas autoriser une commande vide en base. |
| Artisan | Apprenant suivant une ou plusieurs formations — distinct de Créateur et de Technicien. |
| Offline-first | Approche où l'application reste fonctionnable sans connexion, stocke en local, puis synchronise au retour réseau — s'applique à Collecte, pas au reste de la plateforme. |
| MOA / MOE | MOA = la direction d'AS'Soué (client, commanditaire) · MOE = l'équipe de dev (vous). |

## Modèle de classes par pilier

### Pilier Commerce (implémenté cette itération)

| Classe | Rôle |
|---|---|
| Categorie | Regroupe les produits par famille (mobilier, bijoux, chaussures, accessoires). |
| Produit | Article recyclé vendu. |
| Createur | Conçoit les modèles de produits valorisés. |
| Commande | Achat B2B ou B2C. |
| LigneCommande | Classe d'association Commande ↔ Produit, porte la quantité. Multiplicité 1..\* côté Commande. |
| Paiement | Transaction liée à une commande — **implémentée via PayDunya**, pas d'appel direct Orange Money/Moov (voir décision projet, section paiement de `AGENTS.md`). |

### Pilier Collecte (implémenté cette itération)

| Classe | Rôle |
|---|---|
| Depot | Dépôt de déchets déclaré par le fournisseur. |
| PointCollecte | Lieu physique de collecte. |
| Compensation | Rétribution optionnelle d'un dépôt. |
| Collecte | Tournée du collecteur, mode hors-ligne. |
| Materiau | Type de déchet valorisé (plastique, pneu…). |
| LigneCollecte | Classe d'association Collecte ↔ Materiau, porte la quantité. |

Point encore ouvert (voir guide d'initialisation, section "ce qui reste à trancher") : la relation exacte Depot ↔ Collecte n'est pas encore figée. Ne fige pas ce point-là seul dans le code sans validation — demande.

### Pilier Formation — hors scope de code cette itération

| Classe | Rôle |
|---|---|
| Formation | Cursus métier vert. |
| ModuleFormation | Unité pédagogique d'une formation. |
| Inscription | Suivi d'un artisan dans une formation. |
| Certification | Validation d'une compétence acquise. |
| Artisan | Apprenant suivant une ou plusieurs formations. |
| Equipement | Matériel de production / atelier. |

Ces classes existent dans le modèle validé du CDC mais ne sont pas implémentées pour la livraison actuelle (4 semaines). Ne crée pas ces entités sauf demande explicite — si une tâche semble en avoir besoin, signale-le, la portée a peut-être changé.

## Règles de relation à respecter

Une Commande ne peut pas exister sans au moins une LigneCommande — ne valide jamais la création d'une commande vide côté service, quel que soit ce que permettrait une validation de façade plus laxiste.

Une Collecte est liée à un Matériau via LigneCollecte de la même manière — même logique de multiplicité minimale.

Compensation est une relation optionnelle à un Depot — ne force pas sa présence dans le modèle ou les DTO (champ nullable, pas de contrainte NOT NULL en base).
