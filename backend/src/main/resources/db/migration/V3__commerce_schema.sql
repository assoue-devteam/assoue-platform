-- Schéma du module commerce : catalogue, créateurs, commandes

CREATE TABLE categorie (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE createur (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    contact VARCHAR(255)
);

CREATE TABLE produit (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    prix NUMERIC(10, 0) NOT NULL,
    categorie_id BIGINT NOT NULL REFERENCES categorie(id),
    createur_id BIGINT REFERENCES createur(id)
);

CREATE TABLE commande (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id),
    statut VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE_PAIEMENT',
    date_creation TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE ligne_commande (
    id BIGSERIAL PRIMARY KEY,
    commande_id BIGINT NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
    produit_id BIGINT NOT NULL REFERENCES produit(id),
    quantite INT NOT NULL,
    prix_unitaire NUMERIC(10, 0) NOT NULL
);
