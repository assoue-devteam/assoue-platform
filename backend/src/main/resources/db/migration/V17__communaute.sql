-- Page Communauté : événements publiés par l'admin (vitrine, pas d'inscription en base)
-- et chiffres saisis par l'admin. Aucune donnée inventée : les tables démarrent vides.
CREATE TABLE evenement (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(150) NOT NULL,
    date_debut TIMESTAMP NOT NULL,
    lieu VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    places_restantes INT CHECK (places_restantes >= 0),
    date_creation TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE chiffre_communaute (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(80) NOT NULL,
    valeur INT NOT NULL CHECK (valeur >= 0),
    ordre INT NOT NULL DEFAULT 0
);
