# AS'Soué — Guide sécurité & bonnes pratiques (backend Spring Boot)

> Public : équipe dev AS'Soué (Spring Boot 3.x + Angular, PWA offline, paiement PayDunya).
> Objectif : savoir **quelles failles guettent une app codée avec l'IA**, **quoi implémenter** et **dans quel ordre**, vu qu'il reste ~4 semaines.
> Ce document est un guide, pas une garantie : la seule preuve de sécurité, c'est de tester (voir section 9).

---

## Sommaire

1. Pourquoi les apps « vibe-codées » sont vulnérables
2. Les failles les plus fréquentes (avec correction)
3. Backend Spring Boot : ce qu'il faut implémenter
4. Points spécifiques à AS'Soué (PayDunya, offline, rôles, uploads)
5. Frontend Angular (rappels rapides)
6. Infrastructure & déploiement
7. Qualité de code & workflow d'équipe
8. Règles à donner à Claude Code (`.claude/rules/security.md`)
9. Tester la sécurité (outils gratuits)
10. Checklist priorisée (P0 / P1 / P2)
11. Données personnelles
12. Ressources

---

## 1. Pourquoi les apps « vibe-codées » sont vulnérables

L'IA écrit du code qui **marche**, pas du code qui **résiste à un attaquant**. Les causes récurrentes :

- **Le chemin heureux uniquement** : ça fonctionne quand l'utilisateur est gentil. Personne ne teste « et si j'envoie l'ID d'un autre utilisateur ? ».
- **Sécurité déléguée au frontend** : boutons cachés, routes Angular gardées… mais l'API, elle, répond à tout le monde.
- **Code copié sans être relu** : on accepte le diff sans comprendre → failles invisibles.
- **Secrets dans le code** : clé API, mot de passe BDD, secret JWT en dur, puis `git push`.
- **Configuration de dev laissée en prod** : CORS `*`, console H2, stacktraces, Swagger ouvert, `ddl-auto=update`.
- **Dépendances inventées ou douteuses** : l'IA suggère parfois un package qui n'existe pas (un attaquant peut le publier ensuite — « slopsquatting »).
- **Pas de tests de sécurité**, pas de revue, pas de limite de débit.

**Règle d'or : tout ce qui vient du client est hostile** (body, query, headers, cookies, fichiers, montants, IDs, rôles, timestamps).

---

## 2. Les failles les plus fréquentes

| # | Faille | Comment ça arrive | Correction |
|---|--------|-------------------|------------|
| 1 | **Contrôle d'accès cassé / IDOR** | `GET /api/commandes/42` renvoie la commande de n'importe qui | Toujours filtrer par propriétaire : `findByIdAndUserId(id, currentUserId)` ; rôles vérifiés côté serveur |
| 2 | **Authentification faible** | Mots de passe en clair/MD5, pas de limite de tentatives, messages « email inconnu » | BCrypt/Argon2, rate limiting, message générique |
| 3 | **JWT mal géré** | Secret faible/en dur, expiration de 30 jours, token dans les logs, algorithme non fixé | Secret ≥ 256 bits en variable d'env, access token court (15 min), refresh token rotatif |
| 4 | **Injection SQL/JPQL** | Concaténation de chaînes dans une requête native | Requêtes paramétrées (`@Param`, Spring Data), jamais de `"... " + input` |
| 5 | **Mass assignment** | On reçoit directement l'entité JPA → le client envoie `"role":"ADMIN"` | DTO dédiés (records) : uniquement les champs autorisés |
| 6 | **Validation d'entrée absente** | Quantité négative, prix envoyé par le client, chaînes de 10 Mo | `@Valid` + contraintes Bean Validation, prix **recalculé côté serveur** |
| 7 | **Secrets exposés** | `application.yml` avec mot de passe committé, `.env` sur GitHub | Variables d'environnement, `.gitignore`, gitleaks, rotation si fuite |
| 8 | **CORS trop permissif** | `allowedOrigins("*")` + credentials | Liste blanche d'origines exactes |
| 9 | **Fuite d'informations** | Stacktrace dans la réponse, `/actuator/env` ouvert, Swagger public | `include-stacktrace=never`, Actuator limité à `health`, Swagger désactivé en prod |
| 10 | **Upload de fichiers dangereux** | On accepte n'importe quel fichier, nom d'origine conservé | Validation type réel + taille, nom UUID, stockage hors webroot |
| 11 | **Webhooks de paiement non vérifiés** | N'importe qui appelle `/webhook` avec « payé = true » | Vérifier la signature **et** re-confirmer auprès du prestataire |
| 12 | **Logique métier manipulable** | Prix, remise, statut de commande modifiables par le client | Logique et calculs uniquement côté serveur, machine à états pour les statuts |
| 13 | **Absence de rate limiting** | Brute force login, spam d'inscriptions, scraping | Limiter login, inscription, reset mot de passe, endpoints publics |
| 14 | **XSS** | Affichage de HTML non échappé (descriptions produits, commentaires) | Angular échappe par défaut : ne pas contourner ; nettoyer côté serveur si HTML accepté |
| 15 | **CSRF** | Auth par cookie sans protection | JWT en header `Authorization` **ou** cookie `SameSite` + token CSRF |
| 16 | **Dépendances vulnérables/fantômes** | Vieille version avec CVE, package halluciné | `dependency-check`, Dependabot, vérifier chaque nouvelle dépendance |
| 17 | **Journalisation dangereuse** | Mots de passe, tokens, numéros de téléphone dans les logs | Ne jamais logger de secrets/PII ; logs d'audit pour actions sensibles |
| 18 | **Configuration BDD dangereuse** | Connexion en `root`, port 5432 ouvert, `ddl-auto=create` | Utilisateur BDD à privilèges minimaux, Flyway, `ddl-auto=validate` |
| 19 | **Pas de HTTPS / en-têtes manquants** | HTTP en clair, pas de HSTS/CSP | TLS partout, en-têtes de sécurité |
| 20 | **Race conditions** | Deux commandes simultanées pour le dernier stock | Verrouillage optimiste (`@Version`) ou contraintes BDD |

---

## 3. Backend Spring Boot : ce qu'il faut implémenter

### 3.1 Authentification

- **Hash des mots de passe** : `BCryptPasswordEncoder` (coût 10–12) ou `Argon2PasswordEncoder`. Jamais de hash maison, jamais MD5/SHA seul.
- **Politique de mot de passe** : longueur minimale (≥ 10), refuser les mots de passe triviaux. La longueur compte plus que les caractères spéciaux imposés.
- **Login** : même réponse et même temps pour « email inconnu » et « mauvais mot de passe » (`Identifiants invalides`).
- **Verrouillage/limitation** : après N échecs, ralentir ou bloquer temporairement (par IP + par compte).
- **Reset de mot de passe** : token aléatoire à usage unique, expiration courte (15–30 min), stocké **hashé**, invalidé après usage.
- **Vérification email/téléphone** si les comptes B2B/B2C touchent au paiement.

```java
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

### 3.2 JWT

- Secret ≥ 256 bits, **lu depuis une variable d'environnement** (jamais dans le repo).
- Algorithme fixé (HS256 ou RS256) : ne jamais accepter l'algorithme indiqué par le token.
- Vérifier `exp`, `iss`, `sub` à chaque requête.
- **Access token : 10–15 min.** **Refresh token : plusieurs jours, rotatif**, stocké côté serveur (hashé) pour pouvoir le révoquer (logout, vol de token).
- Mettre dans le token le strict minimum (id, rôles). Pas d'email, pas de téléphone.
- Ne jamais logger un token.

**Où stocker côté Angular ?** Compromis honnête :
- `localStorage` : simple mais lisible par tout script injecté (XSS).
- Access token en mémoire + refresh token en cookie `HttpOnly; Secure; SameSite=Strict` : meilleur, mais impose de gérer le CSRF sur l'endpoint de refresh.
Pour le projet : la 2e option si vous avez le temps, sinon la 1re avec une CSP stricte et zéro `innerHTML`.

### 3.3 Autorisation (le point n°1 à ne pas rater)

Deux niveaux à toujours combiner :

1. **Par rôle** (qui a le droit d'appeler cet endpoint) :

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // OK uniquement si JWT dans le header Authorization (pas de cookie d'auth)
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/produits/**").permitAll()
                .requestMatchers("/api/paiements/webhook").permitAll() // protégé par signature, voir 4.1
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/collectes/**").hasAnyRole("COLLECTEUR", "ADMIN")
                .anyRequest().authenticated()      // par défaut : tout est fermé
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

   Principe : **deny by default** (`anyRequest().authenticated()`), on ouvre au cas par cas.

2. **Par ressource** (est-ce *sa* commande / *sa* collecte ?) :

```java
// MAL : n'importe quel utilisateur connecté peut lire n'importe quelle commande
Order order = orderRepository.findById(id).orElseThrow();

// BIEN : la requête inclut le propriétaire
Order order = orderRepository.findByIdAndCustomerId(id, currentUser.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable")); // 404 plutôt que 403 : ne révèle pas l'existence
```

Ne **jamais** prendre l'id utilisateur dans le body ou l'URL pour « qui suis-je » : le prendre dans le token (`SecurityContext`).

### 3.4 DTO + validation (contre mass assignment et entrées hostiles)

Ne jamais exposer ni recevoir une entité JPA directement.

```java
public record CreateOrderRequest(
        @NotEmpty @Size(max = 50) List<@Valid OrderItemRequest> items) {}

public record OrderItemRequest(
        @NotNull UUID productId,
        @Min(1) @Max(100) int quantity) {}   // PAS de champ "price" : le prix vient de la BDD

@PostMapping
public OrderResponse create(@Valid @RequestBody CreateOrderRequest req) { ... }
```

- Montants : `BigDecimal`, calculés **côté serveur** à partir des prix en base.
- Statuts : enum + transitions autorisées (ex. `EN_ATTENTE → PAYEE → EXPEDIEE`), jamais un statut envoyé librement par le client.
- Limiter la taille des payloads : `server.tomcat.max-swallow-size`, `spring.servlet.multipart.max-file-size`, `@Size` sur les listes/chaînes.
- Réponses : DTO de sortie aussi (ne pas renvoyer `passwordHash`, notes internes, etc.).

### 3.5 Accès aux données

- Spring Data / JPQL avec paramètres nommés. Requêtes natives : `@Param`, jamais de concaténation.
- Tri/filtre dynamiques (`sort=...`) : **liste blanche** des champs autorisés.
- `spring.jpa.hibernate.ddl-auto=validate` en prod + migrations **Flyway** (ou Liquibase).
- Utilisateur BDD applicatif sans droits `DROP`/`CREATE USER`.
- `@Version` (verrouillage optimiste) sur commandes, stocks, entités synchronisées offline.
- Pagination obligatoire sur tous les endpoints de liste (`Pageable`, `size` plafonné, ex. 100).

### 3.6 Gestion des erreurs

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> notFound(ResourceNotFoundException e) {
        return ResponseEntity.status(404).body(new ApiError("NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)   // filet de sécurité
    ResponseEntity<ApiError> unexpected(Exception e) {
        log.error("Erreur inattendue", e);  // détail dans les logs, pas dans la réponse
        return ResponseEntity.status(500).body(new ApiError("INTERNAL_ERROR", "Une erreur est survenue"));
    }
}
```

```yaml
# application-prod.yml
server:
  error:
    include-stacktrace: never
    include-message: never
    include-binding-errors: never
spring:
  jpa:
    show-sql: false
    hibernate:
      ddl-auto: validate
  h2:
    console:
      enabled: false
management:
  endpoints:
    web:
      exposure:
        include: health
springdoc:
  api-docs:
    enabled: false        # ou protéger Swagger derrière ADMIN
  swagger-ui:
    enabled: false
```

### 3.7 CORS

```java
@Bean
CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins}") List<String> origins) {
    var c = new CorsConfiguration();
    c.setAllowedOrigins(origins);                         // ex. https://assoue.bf — jamais "*"
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
    c.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    c.setMaxAge(3600L);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", c);
    return source;
}
```

Rappel : CORS protège le navigateur, **pas** l'API. Un `curl` ignore CORS ; l'auth reste indispensable.

### 3.8 Rate limiting

- Bibliothèque : **Bucket4j** (ou filtre maison + cache), ou au niveau du reverse proxy (nginx `limit_req`).
- À limiter en priorité : `/auth/login`, `/auth/register`, reset mot de passe, envoi d'OTP/SMS, endpoints de recherche publics, création de commande.
- Réponse `429 Too Many Requests` avec `Retry-After`.

### 3.9 En-têtes de sécurité

Spring Security ajoute déjà `X-Content-Type-Options`, `X-Frame-Options`, `Cache-Control`. À compléter (surtout côté nginx/hébergement du frontend) :

- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (au minimum `default-src 'self'`, adapter pour Angular)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (désactiver caméra/micro/géoloc si inutiles… ou les autoriser explicitement si la collecte utilise la géoloc)

### 3.10 Secrets & configuration

- Aucun secret dans le repo : ni `application.yml`, ni `.env`, ni Dockerfile, ni commentaire.
- Profils : `application.yml` (générique) + `application-dev.yml` + `application-prod.yml`. Les valeurs sensibles : `${DB_PASSWORD}`, `${JWT_SECRET}`, `${PAYDUNYA_MASTER_KEY}`…
- `.gitignore` : `.env`, `application-local.yml`, `*.pem`, `*.jks`.
- **Si un secret a été committé : le considérer comme compromis → le révoquer/changer.** Le supprimer du dernier commit ne suffit pas, l'historique Git le garde.
- Scanner : `gitleaks` en pre-commit et en CI.

### 3.11 Logs & audit

- Logger : connexions (succès/échecs), changements de rôle, création/annulation de commande, paiements, actions admin, suppression de données.
- Ne **jamais** logger : mots de passe, tokens, clés API, numéros de téléphone complets, corps de requêtes de paiement.
- Neutraliser les retours à la ligne dans les valeurs loguées (log injection).
- Garder un identifiant de corrélation par requête pour le débogage.

---

## 4. Points spécifiques à AS'Soué

### 4.1 Paiement (PayDunya : Orange Money / Moov)

- **Ne jamais croire le frontend** : la page de retour « paiement réussi » n'est pas une preuve. Seule la confirmation serveur à serveur compte.
- **Webhook/IPN** :
  1. Vérifier l'authenticité selon la documentation PayDunya (signature/hash fourni).
  2. **Re-confirmer** le statut en interrogeant l'API PayDunya avec le token de transaction.
  3. Comparer montant et référence avec **votre** commande en base.
  4. Rendre le traitement **idempotent** : contrainte d'unicité sur l'id de transaction, un webhook rejoué ne doit pas valider deux fois.
- Le montant vient de la commande en base, jamais d'un champ envoyé par le client.
- Clés PayDunya : variables d'environnement, jamais dans Angular (le frontend est public).
- Stocker uniquement : référence de transaction, statut, montant. **Pas** de numéros de portefeuille/PIN.
- Journaliser chaque événement de paiement (audit).

### 4.2 Rôles et périmètres

Définir noir sur blanc une matrice « qui peut faire quoi » avant de coder les endpoints, par exemple :

| Ressource | Visiteur | Client B2C/B2B | Collecteur | Admin |
|-----------|----------|----------------|------------|-------|
| Catalogue produits (lecture) | ✅ | ✅ | ✅ | ✅ |
| Ses commandes | ❌ | ✅ (les siennes) | ❌ | ✅ |
| Créer une collecte | ❌ | ❌ | ✅ | ✅ |
| Voir les collectes | ❌ | ❌ | ✅ (les siennes) | ✅ |
| Gestion utilisateurs/rôles | ❌ | ❌ | ❌ | ✅ |

Écrire ensuite **un test par case ❌** (voir section 9). L'inscription publique ne doit jamais permettre de choisir son rôle : rôle par défaut fixé côté serveur, promotion par un admin uniquement.

### 4.3 Module collecteur hors-ligne (PWA + IndexedDB)

- **IndexedDB n'est pas chiffré** : n'y stocker ni token long, ni secret, ni données personnelles inutiles. Vider les données locales à la déconnexion.
- La synchronisation est un endpoint d'écriture comme les autres : **auth + autorisation + validation complète**. Ne pas faire confiance aux données parce qu'elles viennent « de notre appli ».
- **UUID générés côté client** : vérifier le format, refuser les collisions avec des ressources d'un autre utilisateur (contrainte d'unicité + contrôle du propriétaire).
- **Idempotence** : un batch renvoyé deux fois (réseau instable) ne doit pas créer de doublons.
- **Conflits** : `@Version` + règle claire (le serveur gagne, ou dernier écrit valide). Ne pas se fier à l'horodatage du client pour les décisions d'ordre/sécurité.
- Plafonner la taille et le nombre d'éléments par batch de synchronisation.
- Service worker : ne pas mettre en cache les réponses authentifiées sensibles.

### 4.4 Uploads (photos de déchets, images produits)

- Limiter taille (`spring.servlet.multipart.max-file-size=5MB`) et nombre.
- Vérifier le **type réel** (magic bytes, ex. Apache Tika), pas seulement l'extension ni le `Content-Type` envoyé.
- Autoriser une liste blanche (jpeg, png, webp). Pas de SVG/HTML non nettoyé (XSS).
- Renommer en UUID, ne jamais réutiliser le nom d'origine (path traversal `../`).
- Stocker hors du dossier servi directement ; servir via un endpoint contrôlé ou un stockage objet.
- Supprimer les métadonnées EXIF (elles contiennent souvent la position GPS).

### 4.5 E-commerce B2B/B2C

- Stock : décrémenter dans la même transaction que la commande, avec verrouillage optimiste ou `UPDATE ... WHERE stock >= :qty`.
- Codes promo/remises : validés et appliqués côté serveur, usage limité, non devinables.
- Numéros de commande non séquentiels exposés publiquement (UUID) pour éviter l'énumération.
- Emails/SMS : ne pas construire de contenu à partir d'entrées non nettoyées.

---

## 5. Frontend Angular (rappels rapides)

- **Le frontend est public** : aucune clé secrète dans `environment.ts`. Seules les clés publiques y ont leur place.
- Les `CanActivate` guards = confort d'UX, **pas** de sécurité. La vraie barrière est le backend.
- Ne pas utiliser `bypassSecurityTrustHtml/Url/Script` ni `innerHTML` avec du contenu utilisateur.
- Intercepteur HTTP : ajoute le token, gère le 401 (refresh puis logout), ne logge rien de sensible.
- Ne pas exposer d'infos techniques dans les messages d'erreur affichés.
- `npm audit` régulièrement ; vérifier chaque nouvelle dépendance (existe réellement, maintenue, téléchargée).
- Build de production (`ng build`) : pas de source maps publiques.

---

## 6. Infrastructure & déploiement

- **HTTPS partout** (Let's Encrypt / certificat de l'hébergeur), redirection HTTP → HTTPS.
- Reverse proxy (nginx/Caddy) devant Spring Boot ; Spring Boot n'est pas exposé directement.
- **La base de données n'est jamais accessible depuis Internet** (réseau privé / firewall).
- Docker : image de base à jour, exécution en **utilisateur non-root**, pas de secrets dans l'image ni dans le `docker-compose.yml` committé.
- Sauvegardes de la BDD automatiques **et testées** (une sauvegarde jamais restaurée n'est pas une sauvegarde).
- Mises à jour : JDK, Spring Boot, image de base, OS. Activer Dependabot/Renovate.
- Séparer les environnements : dev / test / prod, avec des secrets et des données différents. Pas de vraies données clients en dev.
- Comptes d'administration : mots de passe forts, 2FA si possible, pas de compte `admin/admin` par défaut.

---

## 7. Qualité de code & workflow d'équipe

**Architecture**
- Couches claires : `controller` (HTTP) → `service` (métier) → `repository` (données). La logique métier reste dans les services.
- DTO ≠ entités. Mapper avec MapStruct ou à la main.
- Une classe = une responsabilité ; pas de logique dans les controllers.
- Nommage cohérent, API REST cohérente (verbes HTTP, codes de statut corrects : 201, 400, 401, 403, 404, 409, 429).

**Tests**
- Tests unitaires sur les services (règles métier : calcul de prix, transitions de statut).
- Tests d'intégration avec **Testcontainers** (vraie BDD PostgreSQL/MySQL).
- **Tests de sécurité** avec `spring-security-test` (`@WithMockUser`, `jwt()`), voir section 9.

**Workflow Git**
- Pull request obligatoire + relecture par un autre membre avant merge, en particulier pour tout ce qui touche auth, paiement, uploads.
- CI (GitHub Actions) : build + tests + `dependency-check` + `gitleaks` à chaque PR.
- Commits petits et fréquents (protège aussi contre R6, la perte de code).
- Branche `main` protégée.

**Relecture du code généré par l'IA**
- Ne jamais merger un diff qu'on ne sait pas expliquer.
- Après chaque génération d'endpoint, se poser 4 questions :
  1. Qui peut l'appeler ? (auth/rôle)
  2. Sur quelles données ? (propriétaire)
  3. Que se passe-t-il si les entrées sont absurdes ? (validation)
  4. Qu'est-ce qui fuit dans la réponse/les logs ?
- Vérifier que chaque dépendance ajoutée existe vraiment sur Maven Central / npm.
- Ne pas coller de secrets, de vraies données clients ou de clés dans les prompts.

---

## 8. Règles à donner à Claude Code

Créer `.claude/rules/security.md` (ou l'ajouter au `CLAUDE.md`) pour que l'agent applique ces règles par défaut :

```markdown
# Règles de sécurité — AS'Soué (backend Spring Boot)

- Tout endpoint est protégé par défaut (deny by default). Toute exception publique doit être justifiée en commentaire.
- Aucune entité JPA en entrée/sortie d'API : utiliser des DTO (records) avec Bean Validation.
- Ne jamais accepter de prix, rôle, statut, id utilisateur ou montant depuis le client : recalculer/déduire côté serveur.
- Toute requête sur une ressource utilisateur filtre par propriétaire (ex. findByIdAndCustomerId). Retourner 404 si non trouvé/non autorisé.
- Requêtes JPQL/SQL paramétrées uniquement, jamais de concaténation. Tris/filtres dynamiques via liste blanche.
- Secrets uniquement via variables d'environnement (${...}). Ne jamais écrire de secret, clé ou mot de passe dans le code, les tests ou la doc.
- Ne jamais logger mots de passe, tokens, clés API, numéros de téléphone complets, payloads de paiement.
- Montants en BigDecimal. Statuts en enum avec transitions validées.
- Webhooks de paiement : vérifier la signature, re-confirmer auprès de PayDunya, traitement idempotent.
- Uploads : taille max, liste blanche de types vérifiés par contenu, nom de fichier en UUID.
- Ne pas ajouter de dépendance sans vérifier qu'elle existe, est maintenue, et sans me la signaler.
- Chaque nouvel endpoint = au moins un test d'autorisation (401 sans token, 403 mauvais rôle, 404 ressource d'un autre utilisateur).
- Config de prod : pas de stacktrace, Actuator limité à health, Swagger désactivé, ddl-auto=validate.
```

Prompt de **revue de sécurité** à lancer avant chaque merge important :

```text
Fais une revue de sécurité de ce diff comme un pentester : contrôle d'accès/IDOR, mass assignment,
validation, injection, fuite de données dans réponses/logs, secrets, gestion d'erreurs, race conditions.
Liste chaque problème avec sa gravité, la ligne concernée et la correction. Ne réécris pas le code sans que je le demande.
```

---

## 9. Tester la sécurité

**Tests automatiques (à écrire vous-mêmes)**

```java
@Test
void utilisateur_ne_peut_pas_lire_la_commande_d_un_autre() throws Exception {
    mockMvc.perform(get("/api/commandes/{id}", commandeDeAlice.getId())
            .with(jwt().jwt(j -> j.subject(bob.getId().toString()))))
        .andExpect(status().isNotFound());
}

@Test
void endpoint_admin_refuse_un_client() throws Exception {
    mockMvc.perform(get("/api/admin/utilisateurs").with(user("client").roles("CLIENT")))
        .andExpect(status().isForbidden());
}

@Test
void requete_sans_token_est_refusee() throws Exception {
    mockMvc.perform(get("/api/commandes")).andExpect(status().isUnauthorized());
}
```

**Outils gratuits**

| Besoin | Outil |
|--------|-------|
| Scanner l'app en marche | **OWASP ZAP** (baseline scan) |
| Manipuler/rejouer des requêtes | Burp Suite Community, Postman |
| Dépendances Java vulnérables | **OWASP Dependency-Check** (plugin Maven), Dependabot |
| Dépendances npm | `npm audit` |
| Secrets dans Git | **gitleaks**, GitHub secret scanning |
| Qualité + failles de code | SonarCloud / SonarQube Community |
| Analyse des images Docker | Trivy |
| En-têtes HTTP / TLS | securityheaders.com, Mozilla Observatory, SSL Labs |

**Test manuel en 15 minutes (à faire avant la démo)**
1. Créer 2 comptes clients. Avec le token du compte A, essayer d'accéder aux ressources du compte B (changer les IDs).
2. Appeler chaque endpoint `/api/admin/**` avec un token client et sans token.
3. Envoyer un prix négatif, une quantité de 999999, un champ `role: "ADMIN"` à l'inscription.
4. Rejouer un webhook de paiement deux fois ; l'appeler avec un faux payload.
5. Vérifier qu'aucune stacktrace ne sort en provoquant une erreur (JSON invalide, ID inexistant).
6. Chercher un secret dans le repo : `gitleaks detect`.

---

## 10. Checklist priorisée

### 🔴 P0 — Avant toute démo / mise en ligne (non négociable)
- [ ] `anyRequest().authenticated()` + règles de rôles ; aucun endpoint sensible public
- [ ] Contrôle de propriétaire sur **toutes** les ressources utilisateur (commandes, collectes)
- [ ] Mots de passe hashés en BCrypt/Argon2
- [ ] Secret JWT et clés PayDunya en variables d'environnement ; aucun secret dans Git (historique inclus)
- [ ] DTO + `@Valid` partout ; prix/montants/statuts calculés côté serveur
- [ ] Vérification du webhook PayDunya + idempotence
- [ ] Profil `prod` : pas de stacktrace, H2 console off, Actuator réduit, Swagger off, `ddl-auto=validate`
- [ ] CORS en liste blanche
- [ ] HTTPS activé
- [ ] Inscription publique : rôle par défaut fixé côté serveur

### 🟠 P1 — Pendant le sprint
- [ ] Rate limiting login/inscription/reset (Bucket4j ou nginx)
- [ ] Access token court + refresh token rotatif
- [ ] Sécurisation des uploads (type réel, taille, UUID, EXIF)
- [ ] Sync offline : idempotence, ownership, plafonds de taille, `@Version`
- [ ] Flyway + utilisateur BDD à privilèges minimaux
- [ ] `@RestControllerAdvice` global
- [ ] Tests d'autorisation (401/403/404) sur chaque endpoint sensible
- [ ] CI : tests + dependency-check + gitleaks
- [ ] En-têtes de sécurité (HSTS, CSP, Referrer-Policy)

### 🟡 P2 — Si le temps le permet
- [ ] Logs d'audit (connexions, paiements, actions admin)
- [ ] 2FA pour les comptes admin
- [ ] Scan ZAP complet + correction des alertes
- [ ] Pagination et plafonds partout
- [ ] Sauvegardes BDD automatisées et restauration testée
- [ ] Politique de confidentialité + mentions légales + consentement

---

## 11. Données personnelles

AS'Soué collecte des données personnelles (identité, téléphone, adresse, localisation des collectes, historique de commandes). Bonnes pratiques :

- **Minimisation** : ne collecter que ce qui sert vraiment.
- **Finalité et information** : dire à l'utilisateur ce qui est collecté et pourquoi (politique de confidentialité).
- **Accès restreint** : seuls les rôles qui en ont besoin voient les données personnelles.
- **Suppression** : prévoir un moyen de supprimer/anonymiser un compte.
- **Cadre légal au Burkina Faso** : la protection des données personnelles est encadrée par la loi n° 010-2004/AN et l'autorité de contrôle **CIL** (Commission de l'Informatique et des Libertés), déjà identifiée comme partie prenante « conformité critique » dans votre CDC. Vérifier auprès de la CIL les obligations de déclaration/autorisation applicables à AS'Soué.

---

## 12. Ressources

- OWASP Top 10 — https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheet Series (authentification, sessions, JWT, uploads, CSRF…) — https://cheatsheetseries.owasp.org/
- OWASP ASVS (liste de vérification détaillée) — https://owasp.org/www-project-application-security-verification-standard/
- Spring Security Reference — https://docs.spring.io/spring-security/reference/
- OWASP API Security Top 10 — https://owasp.org/www-project-api-security/
