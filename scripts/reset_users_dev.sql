-- =====================================================================
-- RESET & RECREATION DES UTILISATEURS — ENVIRONNEMENT DEV
-- Mot de passe commun de tous les comptes de test : Password123!
-- =====================================================================

BEGIN;

-- 1. Nettoyage des tables dépendantes des utilisateurs
DELETE FROM paiement;
DELETE FROM ligne_commande;
DELETE FROM reservation_stock;
DELETE FROM commande;

DELETE FROM ligne_collecte;
DELETE FROM collecte;

DELETE FROM ligne_panier;
DELETE FROM favori;
DELETE FROM avis;

DELETE FROM utilisateur_role;
DELETE FROM utilisateur;

-- Reset sequence utilisateur
ALTER SEQUENCE utilisateur_id_seq RESTART WITH 1;

-- 2. Création des nouveaux utilisateurs avec le hash BCrypt pour Password123!
INSERT INTO utilisateur (id, email, mot_de_passe, nom, prenom, actif, tentatives_echouees)
VALUES
    (1, 'admin@assoue.bf', '$2a$10$WJG2lnpd5tvErVLxG53DUeAZiihMMYlK.Q8ukIStwgiYOI92srcxy', 'Sawadogo', 'Aminata', TRUE, 0),
    (2, 'client@assoue.bf', '$2a$10$WJG2lnpd5tvErVLxG53DUeAZiihMMYlK.Q8ukIStwgiYOI92srcxy', 'Ouedraogo', 'Awa', TRUE, 0),
    (3, 'collecteur@assoue.bf', '$2a$10$WJG2lnpd5tvErVLxG53DUeAZiihMMYlK.Q8ukIStwgiYOI92srcxy', 'Traore', 'Issa', TRUE, 0),
    (4, 'test@assoue.bf', '$2a$10$WJG2lnpd5tvErVLxG53DUeAZiihMMYlK.Q8ukIStwgiYOI92srcxy', 'Kabore', 'Karim', TRUE, 0),
    (5, 'gestion@assoue.bf', '$2a$10$WJG2lnpd5tvErVLxG53DUeAZiihMMYlK.Q8ukIStwgiYOI92srcxy', 'Diallo', 'Ibrahim', TRUE, 0);

ALTER SEQUENCE utilisateur_id_seq RESTART WITH 6;

-- 3. Attribution des rôles
INSERT INTO utilisateur_role (utilisateur_id, role_id)
SELECT u.id, r.id FROM utilisateur u, role r
WHERE (u.email, r.nom) IN (
    ('admin@assoue.bf', 'ADMIN'),
    ('client@assoue.bf', 'CLIENT'),
    ('collecteur@assoue.bf', 'COLLECTEUR'),
    ('test@assoue.bf', 'CLIENT'),
    ('gestion@assoue.bf', 'ADMIN')
);

-- 4. Démo collectes pour le compte collecteur (Issa Traore, id=3)
INSERT INTO collecte (id, reference_client, collecteur_id, point_collecte_id, statut, date_declaration)
VALUES
    (1, 'COL-DEMO-001', 3, 1, 'DECLAREE', NOW() - INTERVAL '1 day'),
    (2, 'COL-DEMO-002', 3, 2, 'TRAITEE', NOW() - INTERVAL '2 days');

ALTER SEQUENCE collecte_id_seq RESTART WITH 3;

INSERT INTO ligne_collecte (collecte_id, materiau_id, quantite_estimee)
SELECT 1, id, 25.50 FROM materiau WHERE nom = 'Plastique';

INSERT INTO ligne_collecte (collecte_id, materiau_id, quantite_estimee)
SELECT 1, id, 10.00 FROM materiau WHERE nom = 'Pneu';

INSERT INTO ligne_collecte (collecte_id, materiau_id, quantite_estimee)
SELECT 2, id, 50.00 FROM materiau WHERE nom = 'Pneu';

COMMIT;
