-- Produits mis en favori par un client (cœur sur la carte produit).
CREATE TABLE favori (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    produit_id BIGINT NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
    date_ajout TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_favori_utilisateur_produit UNIQUE (utilisateur_id, produit_id)
);
