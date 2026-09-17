-- Schéma du module paiement : transactions PayDunya liées aux commandes

CREATE TABLE paiement (
    id BIGSERIAL PRIMARY KEY,
    commande_id BIGINT NOT NULL UNIQUE REFERENCES commande(id),
    montant NUMERIC(10, 0) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    token_paydunya VARCHAR(255) UNIQUE,
    date_creation TIMESTAMP NOT NULL DEFAULT now(),
    date_confirmation TIMESTAMP
);
