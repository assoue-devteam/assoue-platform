-- Schéma du module collecte : dépôts, points de collecte, tournées, matériaux

CREATE TABLE materiau (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE,
    unite VARCHAR(10) NOT NULL
);

CREATE TABLE point_collecte (
    id BIGSERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL
);

CREATE TABLE depot (
    id BIGSERIAL PRIMARY KEY,
    nom_fournisseur VARCHAR(150) NOT NULL,
    contact_fournisseur VARCHAR(255),
    point_collecte_id BIGINT NOT NULL REFERENCES point_collecte(id),
    date_declaration TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE collecte (
    id BIGSERIAL PRIMARY KEY,
    reference_client VARCHAR(100) NOT NULL UNIQUE,
    collecteur_id BIGINT NOT NULL REFERENCES utilisateur(id),
    point_collecte_id BIGINT NOT NULL REFERENCES point_collecte(id),
    depot_id BIGINT REFERENCES depot(id),
    statut VARCHAR(20) NOT NULL DEFAULT 'DECLAREE',
    date_declaration TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE ligne_collecte (
    id BIGSERIAL PRIMARY KEY,
    collecte_id BIGINT NOT NULL REFERENCES collecte(id) ON DELETE CASCADE,
    materiau_id BIGINT NOT NULL REFERENCES materiau(id),
    quantite_estimee NUMERIC(10, 2) NOT NULL
);

CREATE TABLE compensation (
    id BIGSERIAL PRIMARY KEY,
    depot_id BIGINT NOT NULL UNIQUE REFERENCES depot(id),
    montant NUMERIC(10, 0) NOT NULL,
    date_versement TIMESTAMP
);
