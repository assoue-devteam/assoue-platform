# User Stories — AS'Soué

Extrait du CDC v1.0. Ce sont les critères d'acceptation formels — un développement n'est "fini" que quand ces critères passent, pas juste quand le code compile. Format Gherkin : Étant donné / Quand / Alors.

## US-01 — Consultation du catalogue (F1, Must Have)

En tant que client, je veux consulter le catalogue de produits AS'Soué afin de choisir un article à acheter.

- Étant donné une connexion 3G stable, quand le client ouvre la page catalogue, alors la liste des produits s'affiche en moins de 2 secondes.
- Étant donné un produit sans stock disponible, quand le client consulte sa fiche, alors la mention « Rupture de stock » est affichée et l'ajout au panier est désactivé.

## US-02 — Passer une commande et payer en ligne (F2, Must Have)

En tant que client, je veux régler ma commande par paiement mobile afin de finaliser mon achat sans me déplacer.

- Étant donné un panier non vide, quand le client valide son paiement, alors une demande de paiement est envoyée à PayDunya.
- Étant donné un paiement confirmé par PayDunya, quand la confirmation est reçue, alors la commande passe au statut « Payée » en moins de 10 secondes.
- Étant donné une coupure réseau pendant la transaction, quand la connexion est rétablie, alors le statut réel du paiement est vérifié avant toute validation de commande — aucune commande n'est validée sur une simple absence de réponse.

**Note d'implémentation :** le texte original du CDC mentionne le choix entre Orange Money et Moov directement. Décision prise depuis : passage par **PayDunya**, agrégateur unique qui couvre les deux (`orange-money-burkina` et `moov-burkina-faso`). Le client final peut toujours choisir son opérateur au moment de payer — c'est juste l'intégration technique côté AS'Soué qui passe par un seul fournisseur au lieu de deux intégrations séparées.

## US-03 — Déclarer une collecte (F4, Must Have)

En tant que collecteur, je veux déclarer une collecte de déchets plastiques ou de pneus afin d'être identifié et rémunéré pour mon apport.

- Étant donné un formulaire de déclaration, quand le collecteur saisit le type de déchet, la quantité estimée et sa localisation, alors la déclaration est enregistrée avec un horodatage.
- Étant donné une coupure réseau au moment de la saisie, quand le collecteur valide sa déclaration, alors celle-ci est stockée localement (IndexedDB) puis synchronisée automatiquement au retour du réseau, avec un verrou anti-doublon à la synchronisation.

## US-04 — Suivre le statut d'une commande (F5, Should Have)

En tant que client, je veux suivre l'état d'avancement de ma commande afin de savoir quand je serai livré.

- Étant donné une commande passée, quand son statut change (préparation, expédition, livraison), alors le client reçoit une notification en moins de 30 secondes après la mise à jour.

Rappel de scope : F5 est Should Have, pas Must Have — priorité inférieure à US-01/02/03/05 si le temps manque en semaine 4.

## US-05 — Gérer les stocks (F3, Must Have)

En tant qu'administrateur, je veux visualiser et mettre à jour les niveaux de stock afin de piloter la production et les ventes.

- Étant donné une vente confirmée, quand la commande est validée, alors le stock du produit concerné est décrémenté automatiquement.
- Étant donné une déclaration de collecte validée, quand elle est traitée par l'atelier, alors le stock de matière première correspondant est incrémenté.

## Exigences non fonctionnelles transverses (s'appliquent à toutes les US ci-dessus)

- Performance : catalogue affiché en moins de 2 secondes sur réseau 3G stable, résultat de recherche produit en moins de 1 seconde.
- Sécurité : mots de passe hachés bcrypt, aucune donnée de paiement stockée en clair, HTTPS partout, blocage après 3 tentatives de connexion échouées.
- Disponibilité : 98 % visé, déclaration de collecte possible hors-ligne avec synchronisation automatique au retour du réseau.
- Compatibilité : site web responsive, smartphones Android d'entrée de gamme.
