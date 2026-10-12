CREATE TABLE notification (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    type_id BIGINT NOT NULL,
    destinataire VARCHAR(50) NOT NULL,
    lue BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_notification_type_id UNIQUE (type, type_id)
);
CREATE INDEX idx_notification_destinataire_lue ON notification(destinataire, lue, date_creation);
