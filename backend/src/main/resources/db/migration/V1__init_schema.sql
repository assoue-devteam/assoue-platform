-- Schéma de base : utilisateurs et rôles (module auth)

CREATE TABLE role (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE utilisateur (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    tentatives_echouees INT NOT NULL DEFAULT 0,
    date_creation TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE utilisateur_role (
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    PRIMARY KEY (utilisateur_id, role_id)
);
