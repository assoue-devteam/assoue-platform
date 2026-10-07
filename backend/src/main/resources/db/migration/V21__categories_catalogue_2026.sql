-- Catalogue 2026 : trois nouvelles catégories au-delà des quatre existantes
-- (Mobilier, Bijoux, Chaussures, Accessoires). Idempotent : un rejeu ne
-- crée rien si les catégories sont déjà présentes.
INSERT INTO categorie (nom) VALUES
    ('Maison et jardin'),
    ('Vêtements'),
    ('Décoration et maison')
ON CONFLICT (nom) DO NOTHING;
