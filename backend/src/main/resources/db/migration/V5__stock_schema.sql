-- Schéma du module stock : produits finis et matière première

CREATE TABLE stock_produit (
    id BIGSERIAL PRIMARY KEY,
    produit_id BIGINT NOT NULL UNIQUE REFERENCES produit(id),
    quantite INT NOT NULL DEFAULT 0
);

CREATE TABLE stock_matiere_premiere (
    id BIGSERIAL PRIMARY KEY,
    materiau_id BIGINT NOT NULL UNIQUE REFERENCES materiau(id),
    quantite NUMERIC(10, 2) NOT NULL DEFAULT 0
);
