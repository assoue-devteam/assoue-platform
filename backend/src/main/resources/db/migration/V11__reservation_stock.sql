CREATE TABLE reservation_stock (
    id BIGSERIAL PRIMARY KEY,
    commande_id BIGINT NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
    produit_id BIGINT NOT NULL REFERENCES produit(id),
    quantite INT NOT NULL CHECK (quantite > 0),
    CONSTRAINT uq_reservation_stock_commande_produit UNIQUE (commande_id, produit_id)
);

ALTER TABLE stock_produit
    ADD CONSTRAINT ck_stock_produit_quantite_non_negative CHECK (quantite >= 0);
