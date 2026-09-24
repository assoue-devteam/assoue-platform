-- SA-06 : trace du dernier webhook PayDunya reçu, pour que le super admin puisse
-- comparer le statut annoncé par le webhook et le statut réellement revalidé.

ALTER TABLE paiement ADD COLUMN statut_annonce_webhook VARCHAR(50);
ALTER TABLE paiement ADD COLUMN date_dernier_webhook TIMESTAMP;
