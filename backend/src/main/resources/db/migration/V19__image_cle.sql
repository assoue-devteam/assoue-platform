-- Clé d'image uploadée (lot 8) : image_url legacy (https) conservée, rien n'est migré.
ALTER TABLE produit ADD COLUMN image_cle VARCHAR(100);
ALTER TABLE evenement ADD COLUMN image_cle VARCHAR(100);
