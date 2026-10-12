# Checklist de mise en production — AS'Soué Platform

> Document de référence : liste exhaustive de ce qui manque ou doit être vérifié avant de passer l'application en production.
> Mis à jour le : 2026-10-11

---

## 🔴 Bloquants — L'app ne fonctionnera pas sans ces éléments

### 1. Variables d'environnement obligatoires

Ces variables sont **sans valeur par défaut** en prod : si elles manquent, le backend refuse de démarrer.

| Variable | Rôle | Comment l'obtenir |
|---|---|---|
| `POSTGRES_USER` | Compte PostgreSQL | Créer lors du provisionnement de la BDD |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | Idem — choisir un mot de passe fort |
| `JWT_SECRET` | Signature des tokens d'authentification | Générer (voir ci-dessous) |
| `PAYDUNYA_MASTER_KEY` | Clé maître PayDunya | Tableau de bord PayDunya → Paramètres |
| `PAYDUNYA_PRIVATE_KEY` | Clé privée PayDunya | Idem |
| `PAYDUNYA_TOKEN` | Token PayDunya | Idem |

**Générer JWT_SECRET :**
```powershell
# PowerShell — minimum 64 caractères hexadécimaux
-join ((1..64) | ForEach-Object { '{0:X2}' -f (Get-Random -Max 256) })
```

---

### 2. Profil Spring Production

Sans `SPRING_PROFILES_ACTIVE=prod`, l'application utilise des valeurs permissives (DDL, SQL debug, etc.).

```bash
# Variable d'environnement obligatoire sur le serveur
SPRING_PROFILES_ACTIVE=prod
```

> En mode `prod`, le dossier d'images (`ASSOUE_IMAGES_DIR`) doit être un chemin **absolu** avec un volume monté — l'app refuse de démarrer sinon.

---

### 3. HTTPS

Le backend génère des cookies et des tokens JWT. **Sans HTTPS, ils transitent en clair**.

- Configurer un reverse proxy (Nginx, Traefik, Caddy) avec certificat Let's Encrypt
- Le backend est déjà préparé : `server.forward-headers-strategy: framework`

---

## 🟡 Importants — Fonctionnalités partiellement inactives

### 4. Mail SMTP (Brevo configuré et vérifié)

Le service mail est implémenté et configuré dans `.env`. La connexion et l'authentification SMTP Brevo ont été testées avec succès.

- [x] Renseigner `ASSOUE_MAIL_USERNAME` dans `.env` (`votre-login-smtp@brevo.com`)
- [x] Vérifier l'expéditeur dans Brevo (`votre-expediteur@domaine.com`)
- [x] Renseigner `ASSOUE_MAIL_ALERTES_DESTINATAIRES` (`alertes@domaine.com`)

**Config Brevo dans `.env` :**
```bash
ASSOUE_MAIL_HOST=smtp-relay.brevo.com
ASSOUE_MAIL_PORT=587
ASSOUE_MAIL_USERNAME=votre-login-smtp@brevo.com
ASSOUE_MAIL_PASSWORD=votre-cle-smtp
ASSOUE_MAIL_FROM=votre-expediteur@domaine.com
ASSOUE_MAIL_ALERTES_DESTINATAIRES=alertes@domaine.com
```

---

### 5. Clé HMAC mot de passe oublié

✅ **Déjà généré et configuré dans `.env`** : `ASSOUE_MOTDEPASSE_CLE_HMAC`

En production, mettre cette valeur dans un gestionnaire de secrets (vault, secret manager), pas en dur dans un fichier.

---

### 6. Stockage des photos de signalement

Le code de stockage est un **stub** : il log seulement, sans vraiment sauvegarder les fichiers.

Fichier concerné : `backend/src/main/java/bf/assoue/platform/signalement/service/SignalementService.java` (méthode `stockerFichier`, ligne ~186)

```java
private void stockerFichier(String cle, MultipartFile fichier) {
    // TODO : intégrer avec ImageService / StockageImage
    log.info("Stockage photo signalement cle={} size={}", cle, fichier.getSize());
}
```

**Action :** Connecter au `ImageService` existant (lot 8) qui gère déjà `ASSOUE_IMAGES_DIR`.

---

### 7. Système de signalement/points désactivé

Par sécurité, le système de points et signalements est désactivé par défaut.

**Dans `backend/src/main/resources/application.yml` :**
```yaml
assoue:
  points:
    actif: false   # ← changer à true après validation
```

**Avant d'activer :** tester le flux complet (signalement → validation admin → crédit points → utilisation en commande).

---

### 8. PayDunya — passage en mode live

Actuellement configuré en mode `test`. Pour la production :

- [ ] `PAYDUNYA_MODE=live` (au lieu de `test`)
- [ ] Remplacer toutes les clés test par les clés live du dashboard PayDunya
- [ ] `PAYDUNYA_CALLBACK_URL` = URL de prod (ex: `https://assoue.bf/api/paiements/callback`)
- [ ] `PAYDUNYA_RETURN_URL` = page de confirmation de commande
- [ ] `PAYDUNYA_CANCEL_URL` = page d'annulation
- [ ] Tester un vrai paiement de bout en bout dans sandbox avant le live

---

## 🟢 Déjà en place (bon état)

| Élément | État |
|---|---|
| JWT avec expiration (24h par défaut) | ✅ |
| Révocation JWT sur reset de mot de passe | ✅ |
| Rate limiting IP sur le reset (5 req/min) | ✅ |
| Protection HMAC anti-timing sur les codes | ✅ |
| `open-in-view: false` (pas de N+1 cachés) | ✅ |
| Validation Flyway sur la BDD au démarrage | ✅ |
| Profils Spring séparés (dev / docker / prod) | ✅ |
| Limite de taille des uploads (10 Mo) | ✅ |
| Titres de pages sans tirets cadratins (· au lieu de —) | ✅ |
| Build Angular sans erreur | ✅ |
| Backend compile sans erreur | ✅ |
| MailConfig compatible Brevo (starttls.required + ssl.trust) | ✅ |
| JWT_SECRET sécurisée générée dans .env | ✅ |
| Clé HMAC sécurisée générée dans .env | ✅ |

---

## 📋 Checklist récapitulative avant déploiement

### Sécurité
- [ ] `JWT_SECRET` généré aléatoirement (≥ 64 chars hex) et stocké dans un vault — **en dev : fait**
- [ ] `ASSOUE_MOTDEPASSE_CLE_HMAC` généré aléatoirement (≥ 32 chars hex) — **en dev : fait**
- [ ] `SPRING_PROFILES_ACTIVE=prod` activé sur le serveur
- [ ] HTTPS configuré avec certificat valide
- [ ] Swagger désactivé en prod (non exposé sur le port public)
- [ ] `.env` jamais commité (déjà dans `.gitignore`)
- [ ] `POSTGRES_PASSWORD` fort (≥ 20 chars aléatoires)

### Mail
- [ ] `ASSOUE_MAIL_USERNAME` renseigné (email de compte Brevo)
- [ ] Expéditeur `no-reply@assoue.bf` vérifié dans Brevo → Expéditeurs & Domaines
- [ ] `ASSOUE_MAIL_ALERTES_DESTINATAIRES` renseigné (email(s) admin)
- [ ] Tester le flux « Mot de passe oublié » de bout en bout

### Base de données
- [ ] Sauvegarde PostgreSQL configurée (dump quotidien minimum)
- [ ] Flyway migration testée sur une base propre
- [ ] Comptes de test désactivés ou supprimés en prod

### Paiement
- [ ] Clés PayDunya live obtenues et configurées
- [ ] `PAYDUNYA_MODE=live`
- [ ] URLs de callback pointent vers le domaine de production
- [ ] Test de bout en bout en sandbox réussi

### Images & Signalement
- [ ] `ASSOUE_IMAGES_DIR` = chemin absolu sur volume persistant
- [ ] Volume Docker monté et persistant (pas d'éphémère)
- [ ] `stockerFichier()` dans `SignalementService` connecté à `ImageService`

### Fonctionnalités
- [ ] Système de signalement/points validé manuellement → activer `actif: true`
- [ ] Seed demo (`seed_demo_dev.sql`) jamais exécuté en prod

---

## 🔑 Récapitulatif des variables d'environnement

### État actuel dans `.env` (dev)

| Variable | Statut | Note |
|---|---|---|
| `POSTGRES_USER` | ✅ Configuré | `assoue` |
| `POSTGRES_PASSWORD` | ⚠️ Faible | `change-me` — à sécuriser en prod |
| `JWT_SECRET` | ✅ Sécurisé | Généré (128 chars hex) le 2026-10-11 |
| `ASSOUE_MAIL_HOST` | ✅ Configuré | `smtp-relay.brevo.com` |
| `ASSOUE_MAIL_PORT` | ✅ Configuré | `587` |
| `ASSOUE_MAIL_PASSWORD` | ✅ Configuré | Clé SMTP Brevo (dans `.env`) |
| `ASSOUE_MAIL_USERNAME` | ✅ Configuré | Identifiant Brevo (dans `.env`) |
| `ASSOUE_MAIL_FROM` | ✅ Configuré | Expéditeur vérifié (dans `.env`) |
| `ASSOUE_MAIL_ALERTES_DESTINATAIRES` | ✅ Configuré | Destinataires configurés (dans `.env`) |
| `ASSOUE_MOTDEPASSE_CLE_HMAC` | ✅ Sécurisé | Généré (64 chars hex) le 2026-10-11 |
| `PAYDUNYA_MASTER_KEY` | ❌ Vide | Mode test — clés live à obtenir |
| `PAYDUNYA_PRIVATE_KEY` | ❌ Vide | Mode test — clés live à obtenir |
| `PAYDUNYA_TOKEN` | ❌ Vide | Mode test — clés live à obtenir |
| `ASSOUE_IMAGES_DIR` | ✅ Dev OK | `./uploads` — absolu obligatoire en prod |

---

*Document généré le 2026-10-11. À mettre à jour à chaque release.*
