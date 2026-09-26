# AS'SOUÉ — GÉNÉRATION DE LA MAQUETTE AVEC CLAUDE DESIGN

## CONTEXTE

Nous avons terminé et validé la phase de préparation du projet AS'SOUÉ.

L'audit backend, l'architecture fonctionnelle, les rôles, les gaps backend, le Design System, les règles responsive, l'accessibilité, les priorités P0/P1/P2 et la direction artistique ont déjà été définis et validés.

Tu dois maintenant utiliser ces éléments comme SOURCE DE VÉRITÉ.

NE RECOMMENCE PAS l'analyse du produit depuis zéro.

NE CHANGE PAS arbitrairement les décisions déjà validées.

NE RÉINVENTE PAS le Design System.

Ta mission est maintenant de transformer cette base validée en une maquette interactive, cohérente et réaliste du produit AS'SOUÉ.

---

# 0. PRÉREQUIS — À JOINDRE AVEC CE PROMPT

Ce prompt part du principe que la phase de préparation (audit backend, Design System, architecture des écrans, contrat de design, directions artistiques) a été exécutée et validée. Sans ces éléments concrets, Claude Design n'a rien de réel à quoi se référer, et les instructions du type "utilise le Design System validé" ne veulent rien dire.

Tous ces éléments sont réunis dans le document joint **`docs/design/design-system.md`**, qui est la source de vérité :

- Design System validé : §3 tokens, §4 typographie, §5 layout, §6 composants ;
- architecture des écrans et routes : §7 ;
- contrat de design par écran : §8 ;
- états : §9 ;
- backend gaps à jour : §10 ;
- direction artistique retenue : **B « Atelier »** (§2) ;
- priorités P0/P1/P2 : §15 ;
- données de démonstration : §12.

En cas de différence entre ce prompt et ce document, **le document fait foi**.

---

# 1. OBJECTIF

Construire une maquette fonctionnelle et interactive d'AS'SOUÉ avec Claude Design.

La maquette doit représenter un véritable produit destiné à de vrais utilisateurs.

Elle doit être suffisamment détaillée pour :

- comprendre les parcours utilisateurs ;
- tester la navigation ;
- visualiser les principaux écrans ;
- vérifier la cohérence UX ;
- valider l'identité visuelle ;
- identifier les éventuels problèmes avant développement ;
- servir de référence à Claude Code pour l'implémentation Angular.

La maquette n'est pas une simple présentation graphique.

Elle doit représenter le fonctionnement réel du produit.

---

# 2. SOURCE DE VÉRITÉ

Utilise en priorité, dans cet ordre :

1. décisions validées lors de l'audit AS'SOUÉ ;
2. Design System validé ;
3. architecture fonctionnelle validée ;
4. contrat de design validé ;
5. données et capacités réellement présentes dans le backend ;
6. direction artistique validée ;
7. contraintes techniques Angular/Spring Boot ;
8. règles définies dans ce prompt.

En cas de contradiction :

NE DEVINE PAS.

Signale la contradiction et demande une clarification avant de modifier une décision validée.

---

# 3. CONTEXTE PRODUIT

AS'SOUÉ est une entreprise sociale environnementale centrée sur deux piliers :

### 1. Collecte tracée de déchets

Notamment :

- plastique ;
- pneus ;
- collecte terrain ;
- traçabilité des opérations.

### 2. Valorisation et vente de produits

Marketplace B2B/B2C permettant de vendre des produits fabriqués à partir de déchets valorisés :

- meubles ;
- bijoux ;
- chaussures ;
- accessoires ;
- autres produits réellement présents dans le backend.

La fonctionnalité Formation est HORS SCOPE.

Elle ne doit apparaître nulle part dans la maquette.

---

# 4. RÔLES

Les seuls rôles actifs sont :

## Client

Achète les produits et suit ses commandes.

## Manager/Admin

Une seule et même personne réelle occupe les deux rôles : supervise les opérations métier (commandes, collecte, stock) et administre la plateforme (utilisateurs, paiements, fonctions réellement disponibles). Traite ça comme un espace utilisateur unique — une seule navigation, pas de bascule entre deux comptes ou deux dashboards séparés.

## Collecteur

Travaille sur le terrain et déclare les opérations de collecte.

Le module Collecteur est pensé pour une utilisation mobile et offline-first.

IMPORTANT :

Ne crée jamais un écran ou une action simplement parce qu'elle semble logique pour un rôle.

Vérifie toujours sa présence dans le contrat de design et le backend.

---

# 5. PRIORISATION

Respecte strictement la priorisation déjà validée.

## P0

Écrans indispensables à la V1.

Ils doivent recevoir la priorité absolue dans la maquette.

## P1

Écrans importants mais secondaires.

Ils peuvent être représentés après les P0.

## P2

Écrans pouvant attendre.

Ne cherche pas à tout concevoir immédiatement.

Compte tenu du délai de livraison, la maquette doit d'abord obtenir une V1 cohérente et implémentable.

---

# 6. ARCHITECTURE

Utilise exactement l'architecture des écrans validée précédemment.

Respecte la séparation :

```text
PUBLIC
├── Catalogue = Accueil (pas de page d'accueil séparée, pas de hero)   P0
├── Détails produit                                                    P0
├── Connexion                                                          P0
├── Inscription                                                        P0
└── Panier (accessible sans connexion)                                 P0

CLIENT
├── Mes commandes                                                      P0
├── Détail et suivi de commande                                        P0
└── Paiement PayDunya                                                  P0

MANAGER/ADMIN — espace unique « Gestion » (rôle backend ADMIN)
├── À traiter                                                          P1
├── Collectes (valider, traiter)                                       P0
├── Volumes par collecteur                                             P1
├── Commandes (+ impayées > 24 h) et détail                            P0
├── Stocks (produits finis, matière première)                          P0
├── Utilisateurs (créer, débloquer ; rôles en P1)                      P0
└── Supervision des paiements                                          P1

COLLECTEUR (mobile, offline-first)
├── Nouvelle déclaration                                               P0
├── Mes collectes (+ file d'envoi locale)                              P0
└── Corriger une déclaration                                           P1
```

Routes et contrat détaillés : §7 et §8 du document joint.

N'ajoute aucune section Formation.

---

# 7. NAVIGATION

La navigation doit être cohérente avec les rôles.

Un utilisateur ne doit voir que les fonctionnalités correspondant à ses permissions.

Prévoir :

- navigation publique ;
- navigation authentifiée ;
- navigation Client ;
- navigation Manager/Admin (espace unique) ;
- navigation Collecteur ;
- retour arrière ;
- navigation vers les détails ;
- navigation après action ;
- états d'accès interdit ;
- session expirée lorsque pertinent.

La navigation doit rester simple.

Ne multiplie pas les éléments de menu pour donner une impression de produit plus complet.

---

# 8. DESIGN SYSTEM — VERROUILLÉ

Utilise exclusivement le Design System du document joint (§3 à §6), sans le redéfinir.

Palette retenue : **Forêt et terracotta** — vert forêt `#2D6A4F` (variantes `#1B4332`, `#3C5A40`, teinte `#E6EFEA`) et terracotta `#C1440E` (variante `#C1622D`), fond `#FAF8F4`, surface alternative `#F1EDE6`. Tokens complets : §3 du document joint.

Aucune couleur hors tokens.

Rappels :
- l'accent sert au CTA d'achat (un par écran), jamais à signaler une erreur ;
- les erreurs utilisent `#A12622`, toujours avec une icône et un texte ;
- `#C1622D` n'est jamais utilisé pour du texte courant (contraste insuffisant).

NE CHANGE PAS la palette retenue sans validation.

---

# 9. TYPOGRAPHIE

Utilise exactement la typographie définie dans le Design System validé.

Respecte :

- Display ;
- H1 ;
- H2 ;
- H3 ;
- Body ;
- Small ;
- Caption ;
- Labels ;
- Buttons.

La hiérarchie typographique doit rester cohérente entre toutes les pages.

---

# 10. LAYOUT ET GRILLE

Respecte les règles de :

- largeur maximale ;
- grille ;
- spacing ;
- gutters ;
- breakpoints ;
- radius ;
- shadows.

Ne crée pas une grille différente pour chaque page.

Les pages doivent clairement appartenir au même produit.

---

# 11. RESPONSIVE

Le responsive est une exigence fonctionnelle.

## Client

Mobile-first.

Le produit doit être réellement utilisable sur smartphone.

## Collecteur

Mobile-first prioritaire.

L'interface doit être pensée pour une personne sur le terrain, avec :

- utilisation à une main lorsque possible ;
- actions rapides ;
- informations lisibles ;
- boutons suffisamment grands ;
- faible complexité ;
- connexion instable ;
- fonctionnement offline-first.

## Manager/Admin

Desktop prioritaire mais responsive.

Le mobile ne doit pas être une simple version réduite du desktop.

Adapte réellement :

- navigation ;
- tableaux ;
- formulaires ;
- cartes ;
- filtres ;
- actions ;
- menus.

---

# 12. OFFLINE-FIRST DU COLLECTEUR

Le module Collecteur doit représenter visuellement le fonctionnement offline-first.

Prévoir les états nécessaires :

```text
CONNECTÉ
HORS LIGNE
DONNÉE ENREGISTRÉE LOCALEMENT
EN ATTENTE DE SYNCHRONISATION
SYNCHRONISATION EN COURS
SYNCHRONISATION RÉUSSIE
ÉCHEC DE SYNCHRONISATION
```

L'utilisateur doit toujours comprendre :

- si son action a été enregistrée ;
- si elle est déjà synchronisée ;
- si elle attend une synchronisation ;
- si une erreur nécessite son intervention.

Ne pas dépendre uniquement de la couleur pour communiquer ces états.

---

# 13. PAIEMENT PAYDUNYA

Le paiement utilise PayDunya comme provider unique.

La maquette doit prendre en compte les cas métier réels :

- initiation du paiement ;
- paiement en attente ;
- paiement réussi ;
- paiement échoué ;
- retour après paiement ;
- commande déjà payée ;
- prévention d'une double initiation.

Les problèmes backend connus ne doivent pas être cachés.

Décision validée (détail : §9 « Paiement » du document joint) :

- **Parcours nominal = comportement actuel du backend.** Le client n'est pas ramené automatiquement depuis PayDunya et ne peut pas savoir si un paiement a échoué. Le parcours affiche donc « Paiement non encore confirmé », avec « Vérifier » et « Reprendre le paiement ». **Jamais « Paiement échoué » côté client.**
- **Parcours cible** (retour automatique depuis PayDunya, état « Paiement échoué ») : sur une planche séparée, annotée `[BACKEND GAP] GAP-04`.
- Double initiation : bouton verrouillé dès le clic. Commande déjà payée : aucun bouton de paiement.

---

# 14. ÉTATS OBLIGATOIRES

Ne génère pas uniquement les écrans « heureux ».

Pour les écrans pertinents, prévois :

### Loading

- skeleton ;
- spinner lorsque pertinent ;
- désactivation temporaire des actions.

### Empty

Exemple :

- aucun produit ;
- aucun résultat ;
- aucune commande ;
- aucune collecte ;
- aucune donnée.

### Error

Prévoir :

- erreur serveur ;
- erreur réseau ;
- erreur de validation ;
- erreur métier.

### Permission

Prévoir lorsque pertinent :

- non authentifié ;
- accès interdit ;
- session expirée.

### Offline

Particulièrement pour le Collecteur.

---

# 15. DONNÉES

Toutes les données affichées doivent respecter les données réellement disponibles dans le backend.

NE PAS inventer :

- endpoints ;
- champs ;
- relations ;
- rôles ;
- permissions ;
- statuts ;
- fonctionnalités.

Si une donnée fictive est nécessaire pour rendre la maquette visuellement réaliste :

- elle doit être plausible ;
- elle doit respecter le contexte AS'SOUÉ ;
- elle doit être clairement considérée comme donnée de démonstration ;
- elle ne doit pas introduire une nouvelle fonctionnalité.

---

# 16. GAPS BACKEND

La liste à jour est au §10 du document joint (GAP-01 à GAP-12). Elle remplace toute liste antérieure.

**Déjà livrés dans le backend** : SA-02 (déblocage de compte), SA-06 (supervision des paiements), CL-03 (champ photo `imageUrl`), CL-05 (liste « Mes commandes »). Les écrans correspondants sont à maquetter normalement.

Gaps principaux à rendre visibles :

- GAP-01 : pas de liste des matériaux pour le formulaire Collecteur ;
- GAP-02 : pas d'adresse ni de mode de livraison sur une commande ;
- GAP-03 (MG-02) : aucun statut de commande atteignable après « Payée » ;
- GAP-04 (CL-04) : retour PayDunya et échec de paiement (voir section 13) ;
- GAP-05 : pas de gestion du catalogue (produits, catégories, photos).

NE MASQUE PAS ces limitations.

Lorsqu'un écran dépend d'un gap :

utilise clairement :

`[BACKEND GAP]`

et conserve l'information dans la documentation de la maquette.

---

# 17. COMPOSANTS

Réutilise les composants du Design System.

Ne crée pas un composant visuellement différent simplement parce qu'une nouvelle page est affichée.

Les éléments suivants doivent rester cohérents :

- boutons ;
- inputs ;
- selects ;
- cards ;
- badges ;
- alertes ;
- modales ;
- navigation ;
- sidebar ;
- tables ;
- tabs ;
- dropdowns ;
- avatars ;
- pagination ;
- toasts ;
- skeletons ;
- empty states ;
- error states.

Si un nouveau composant est réellement nécessaire :

1. signale-le ;
2. justifie son besoin ;
3. définis-le comme extension du Design System ;
4. conserve les règles visuelles existantes.

---

# 18. COHÉRENCE VISUELLE

Toutes les pages doivent sembler appartenir au même produit.

Maintenir :

- même système de spacing ;
- même typographie ;
- mêmes composants ;
- mêmes états ;
- mêmes conventions ;
- même langage visuel ;
- même logique de navigation.

Ne crée pas une landing page très travaillée puis des dashboards complètement différents.

La cohérence entre les espaces Public / Client / Manager-Admin / Collecteur est importante, même si leur densité varie.

---

# 19. DIRECTION ARTISTIQUE

Utilise uniquement la direction artistique précédemment validée.

Elle doit rester :

- sobre ;
- crédible ;
- environnementale sans cliché ;
- professionnelle ;
- chaleureuse lorsque pertinent ;
- fonctionnelle ;
- adaptée au contexte burkinabè.

Évite les représentations visuelles environnementales trop génériques.

AS'SOUÉ ne doit pas devenir un simple site « vert écologique ».

L'identité doit venir de la combinaison :

```text
ENVIRONNEMENT
+
TRAÇABILITÉ
+
VALORISATION
+
COMMERCE
+
CONFIANCE
```

---

# 20. ANTI-AI-SLOP — RÈGLE ABSOLUE

Ne cherche pas à rendre le produit spectaculaire.

Évite :

- gradients gratuits ;
- glassmorphism ;
- énormes cartes ;
- trop de cartes dans une même section ;
- boutons pill partout ;
- border-radius excessif ;
- ombres excessives ;
- statistiques décoratives ;
- icônes sans fonction ;
- emojis dans l'interface ;
- énormes héros marketing ;
- slogans artificiels ;
- illustrations génériques ;
- violet/bleu SaaS ;
- interfaces ressemblant à des templates ;
- layouts artificiellement symétriques.

Le design doit donner l'impression d'avoir été conçu par une vraie équipe produit.

Chaque choix visuel doit pouvoir être justifié.

---

# 21. ACCESSIBILITÉ

Respecte le Design System et les bonnes pratiques d'accessibilité :

- contraste ;
- tailles lisibles ;
- labels ;
- focus visible ;
- zones tactiles suffisantes ;
- hiérarchie claire ;
- messages d'erreur explicites ;
- navigation clavier lorsque pertinente ;
- ne pas utiliser uniquement la couleur pour transmettre une information.

L'accessibilité doit être intégrée au design, pas ajoutée après coup.

---

# 22. INTERACTIONS

La maquette doit être interactive lorsque cela apporte une vraie valeur.

Prévoir notamment :

- navigation ;
- ouverture/fermeture des menus ;
- formulaires ;
- validation ;
- filtres ;
- recherche : pas d'endpoint ; filtre texte local sur le catalogue uniquement (P1) ;
- ajout au panier ;
- modification du panier ;
- passage au paiement ;
- états de commande ;
- actions du Collecteur ;
- synchronisation simulée lorsque pertinent ;
- feedback après action ;
- modales ;
- confirmations.

Ne simule pas des fonctionnalités inexistantes simplement pour rendre le prototype plus impressionnant.

---

# 23. PRIORITÉ À L'UTILISABILITÉ

Avant l'esthétique, vérifie :

1. L'utilisateur comprend-il ce qu'il peut faire ?
2. L'utilisateur sait-il où il se trouve ?
3. L'action principale est-elle évidente ?
4. Les informations importantes sont-elles visibles ?
5. Les erreurs sont-elles compréhensibles ?
6. Les états offline sont-ils compréhensibles ?
7. Les parcours sont-ils courts ?
8. Le design fonctionne-t-il réellement sur mobile ?
9. Le rôle de l'utilisateur est-il respecté ?
10. L'écran correspond-il réellement au backend ?

---

# 24. ORDRE DE GÉNÉRATION

Ne génère pas tous les écrans en même temps.

Commence par les écrans P0.

Pour chaque groupe :

1. construire l'écran ;
2. vérifier le Design System ;
3. vérifier la navigation ;
4. vérifier les données ;
5. vérifier les états ;
6. vérifier le responsive ;
7. vérifier les permissions ;
8. vérifier les interactions.

Puis seulement passer au groupe suivant.

---

# 25. VALIDATION AUTOMATIQUE DE CHAQUE ÉCRAN

Après la création de chaque écran, vérifie :

### Produit

- correspond-il au besoin réel ?

### Backend

- les données existent-elles ?
- les endpoints existent-ils ?
- les permissions existent-elles ?

### UX

- le parcours est-il compréhensible ?
- l'action principale est-elle claire ?

### Design System

- couleurs conformes ?
- typographie conforme ?
- spacing conforme ?
- composants conformes ?

### Responsive

- mobile ?
- tablette ?
- desktop ?

### Accessibilité

- contraste ?
- labels ?
- focus ?
- zones tactiles ?

### Anti-AI-slop

- y a-t-il une décoration gratuite ?
- y a-t-il trop de cartes ?
- trop de radius ?
- trop d'ombres ?
- une esthétique SaaS générique ?

Si un écran échoue à l'un de ces contrôles, corrige-le avant de continuer.

---

# 26. NE PAS CODER L'APPLICATION

La maquette doit rester une maquette interactive.

Ne transforme pas cette étape en implémentation complète du frontend Angular.

L'objectif est de produire :

- architecture visuelle ;
- composants ;
- interactions ;
- parcours ;
- états ;
- responsive ;
- référence UX.

L'implémentation Angular viendra ensuite avec Claude Code.

---

# 27. PRÉPARATION POUR CLAUDE CODE

La maquette doit être construite de manière à faciliter son transfert vers Claude Code.

Les éléments importants doivent être clairement identifiables :

- composants ;
- variantes ;
- états ;
- spacing ;
- tokens ;
- couleurs ;
- typographie ;
- responsive ;
- interactions ;
- navigation ;
- dépendances backend.

Ne crée pas de composants impossibles ou inutilement complexes à reproduire en Angular.

Lorsque plusieurs solutions visuelles sont possibles, privilégie celle qui reste raisonnablement simple à implémenter sans sacrifier l'UX.

---

# 28. RÈGLE DE COHÉRENCE FINALE

Avant de considérer la maquette comme terminée, vérifie que :

```text
Produit
   ↓
Parcours utilisateur
   ↓
Écrans
   ↓
Composants
   ↓
Design System
   ↓
Backend
   ↓
Données
   ↓
Permissions
   ↓
Responsive
   ↓
Accessibilité
   ↓
Implémentation Angular possible
```

Tout doit rester cohérent.

---

# 29. LIVRABLE FINAL

À la fin de la génération, la maquette doit permettre de comprendre :

- ce qu'est AS'SOUÉ ;
- qui peut utiliser chaque partie ;
- comment un Client achète ;
- comment un Client suit sa commande ;
- comment un Collecteur travaille sur le terrain ;
- comment fonctionne l'offline-first ;
- comment la même personne (Manager/Admin) supervise les opérations et administre la plateforme depuis un espace unique ;
- comment fonctionne le paiement ;
- comment les erreurs sont gérées ;
- comment le produit fonctionne sur mobile ;
- comment le produit fonctionne sur desktop.

La maquette doit être une représentation crédible du produit réel, pas une démonstration graphique.

---

# 30. CONSIGNE FINALE

Commence maintenant par construire les écrans P0 définis dans l'architecture validée.

Ne modifie pas les décisions validées.

Ne réintroduis pas la Formation.

N'invente aucun endpoint, rôle, donnée ou fonctionnalité.

Respecte le Design System.

Respecte le backend.

Respecte les contraintes du contexte burkinabè.

Respecte le mobile-first pour Client et Collecteur.

Prends en compte PayDunya et l'offline-first.

Évite toute esthétique générique de produit généré par IA.

Construis une expérience cohérente de bout en bout.

La qualité recherchée est :

**réaliste → cohérente → utilisable → crédible → implémentable.**

Pas :

**spectaculaire → complexe → décorative.**
