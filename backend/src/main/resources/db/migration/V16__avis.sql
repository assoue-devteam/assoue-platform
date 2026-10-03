-- Avis d'un client sur un produit qu'il a acheté et payé, un seul par produit (modifiable).
CREATE TABLE avis (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    produit_id BIGINT NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
    note SMALLINT NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire VARCHAR(1000),
    date_creation TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_avis_utilisateur_produit UNIQUE (utilisateur_id, produit_id)
);
