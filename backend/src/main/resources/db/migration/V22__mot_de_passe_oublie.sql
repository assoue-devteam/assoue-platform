ALTER TABLE utilisateur ADD COLUMN mot_de_passe_modifie_le TIMESTAMP;

CREATE TABLE code_reinitialisation (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id),
    code_hache VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT now(),
    date_expiration TIMESTAMP NOT NULL,
    essais_restants INT NOT NULL DEFAULT 5,
    consomme BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_code_reinitialisation_utilisateur ON code_reinitialisation(utilisateur_id, date_creation);

CREATE TABLE jeton_reset (
    jti VARCHAR(255) PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id),
    consomme BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP NOT NULL DEFAULT now(),
    date_consommation TIMESTAMP
);
