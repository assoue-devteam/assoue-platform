# Maquette AS'SOUÉ — P0

Export Claude Design (26/09/2026) des écrans P0. Référence visuelle pour l'implémentation Angular ; les règles, textes et gaps font foi dans `../design-system.md`.

| Fichier | Contenu |
|---|---|
| `Fondations.dc.html` | tokens, typographie, composants et leurs états |
| `Boutique.dc.html` | PUB-01 à PUB-04, CLI-01 |
| `Commandes.dc.html` | CLI-03 à CLI-05, états de paiement, planche cible GAP-04 |
| `Collecte.dc.html` | COL-A, COL-B, états de synchronisation, GPS |
| `Gestion.dc.html` | GES-02, GES-04/05, GES-06, GES-08/09 |
| `Transverses.dc.html` | 404, accès refusé, session expirée, erreur serveur, hors ligne |
| `app-header.dc.html`, `app-product-card.dc.html` | composants partagés |
| `support.js` | moteur d'affichage Claude Design (généré, ne pas modifier) |

Pour l'ouvrir, il faut un serveur local : `support.js` charge les fichiers voisins, ce qui ne fonctionne pas en `file://`. Il charge aussi React depuis unpkg, donc une connexion internet est nécessaire.

```bash
cd docs/design/maquette && python -m http.server 8765
```

Puis ouvrir http://localhost:8765/Fondations.dc.html.

Les annotations `[BACKEND GAP]`, `[À CONFIRMER]` et `[DÉMO]` (composant `app-gap-note`) sont propres à la maquette et ne sont pas à implémenter.
