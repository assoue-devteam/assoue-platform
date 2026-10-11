CREATE TABLE zone (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_zone_actif ON zone(actif);

CREATE TABLE signalement (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES utilisateur(id),
    zone_id BIGINT NOT NULL REFERENCES zone(id),
    description VARCHAR(500) NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    motif_rejet VARCHAR(500),
    date_creation TIMESTAMP NOT NULL DEFAULT now(),
    date_validation TIMESTAMP,
    valide_par BIGINT REFERENCES utilisateur(id),
    version INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_signalement_client ON signalement(client_id);
CREATE INDEX idx_signalement_zone ON signalement(zone_id);
CREATE INDEX idx_signalement_statut ON signalement(statut);

CREATE TABLE photo_signalement (
    id BIGSERIAL PRIMARY KEY,
    signalement_id BIGINT NOT NULL REFERENCES signalement(id) ON DELETE CASCADE,
    cle VARCHAR(100) NOT NULL UNIQUE,
    content_type VARCHAR(50) NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE mouvement_points (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES utilisateur(id),
    type VARCHAR(20) NOT NULL,
    points INT NOT NULL,
    type_id BIGINT,
    solde_apres INT NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_mouvement_points_client_type_type_id ON mouvement_points(client_id, type, type_id);
CREATE INDEX idx_mouvement_points_client ON mouvement_points(client_id, date_creation);

CREATE TABLE configuration_points (
    cle VARCHAR(50) PRIMARY KEY,
    valeur VARCHAR(50) NOT NULL
);
INSERT INTO configuration_points (cle, valeur) VALUES
    ('points.par.signalement', '10'),
    ('plafond.journalier', '3'),
    ('plafond.reduction.pourcent', '50'),
    ('points.actif', 'false');