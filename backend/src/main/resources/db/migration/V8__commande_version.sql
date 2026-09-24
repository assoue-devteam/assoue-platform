-- Verrou optimiste sur les commandes pour empêcher les doubles traitements concurrents
ALTER TABLE commande ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
