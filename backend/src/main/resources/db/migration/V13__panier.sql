-- Panier du client connecté, conservé côté serveur pour le retrouver sur tous ses appareils.
CREATE TABLE ligne_panier (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    produit_id BIGINT NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
    quantite INT NOT NULL CHECK (quantite > 0),
    CONSTRAINT uq_ligne_panier_utilisateur_produit UNIQUE (utilisateur_id, produit_id)
);
