-- Verrou optimiste sur les entités de stock
ALTER TABLE stock_produit ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE stock_matiere_premiere ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
