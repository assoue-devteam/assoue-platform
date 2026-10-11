INSERT INTO zone (nom, actif) VALUES
    ('Ouagadougou - Centre', true),
    ('Ouagadougou - Zone Industrielle', true),
    ('Ouagadougou - Paspanga / Baskuy', true),
    ('Ouagadougou - Bogodogo', true),
    ('Bobo-Dioulasso', true),
    ('Koudougou', true)
ON CONFLICT DO NOTHING;
