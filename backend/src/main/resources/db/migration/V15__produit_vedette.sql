-- Produits mis en avant en tête du catalogue, choisis par l'admin.
ALTER TABLE produit ADD COLUMN vedette BOOLEAN NOT NULL DEFAULT FALSE;
