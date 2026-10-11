-- Index sur les colonnes filtrées et jointes (lot 10) : PostgreSQL n'indexe pas
-- les clés étrangères automatiquement, et les statuts sont filtrés partout.
CREATE INDEX IF NOT EXISTS idx_produit_categorie ON produit(categorie_id);
CREATE INDEX IF NOT EXISTS idx_produit_archive ON produit(archive);
CREATE INDEX IF NOT EXISTS idx_ligne_commande_commande ON ligne_commande(commande_id);
CREATE INDEX IF NOT EXISTS idx_ligne_commande_produit ON ligne_commande(produit_id);
CREATE INDEX IF NOT EXISTS idx_commande_client_statut ON commande(utilisateur_id, statut);
CREATE INDEX IF NOT EXISTS idx_collecte_collecteur_statut ON collecte(collecteur_id, statut);
CREATE INDEX IF NOT EXISTS idx_ligne_collecte_collecte ON ligne_collecte(collecte_id);
CREATE INDEX IF NOT EXISTS idx_avis_produit ON avis(produit_id);
