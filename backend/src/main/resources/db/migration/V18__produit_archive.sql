-- Administration du catalogue (GAP-05) : un produit supprimé par l'admin est archivé,
-- jamais effacé physiquement — un produit déjà vendu doit rester lisible dans
-- l'historique des commandes, favoris et paniers. Les archivés sont exclus du catalogue.
ALTER TABLE produit ADD COLUMN archive BOOLEAN NOT NULL DEFAULT FALSE;
