package bf.assoue.platform.common.security;

import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.RoleRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.auth.service.JwtService;
import bf.assoue.platform.auth.service.UtilisateurDetailsService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Token invalide sur route publique = comme sans token (200). Sans token sur
 * route protégée = 401 JSON + WWW-Authenticate (jamais 403). 403 = rôle
 * insuffisant uniquement. /api/auth/login garde ses 401/423 métier.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@AutoConfigureMockMvc
class SecuriteEndpointsIT {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void proprietes(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private UtilisateurDetailsService utilisateurDetailsService;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String secret;

    private String tokenClient;
    private String tokenAdmin;

    @BeforeEach
    void authentifier() {
        String suffixe = String.valueOf(System.nanoTime());
        tokenClient = token("client-sec-" + suffixe + "@example.test", "CLIENT");
        tokenAdmin = token("admin-sec-" + suffixe + "@example.test", "ADMIN");
        utilisateurRepository.save(Utilisateur.builder()
                .email("bloque-sec-" + suffixe + "@example.test")
                .motDePasse(passwordEncoder.encode("BonMotDePasse1"))
                .nom("Test").prenom("Bloque")
                .roles(Set.of(roleRepository.findByNom("CLIENT").orElseThrow()))
                .build());
    }

    private String token(String email, String role) {
        Role roleEntite = roleRepository.findByNom(role).orElseThrow();
        utilisateurRepository.save(Utilisateur.builder()
                .email(email)
                .motDePasse(passwordEncoder.encode("mot-de-passe"))
                .nom("Test").prenom("Secu")
                .roles(Set.of(roleEntite))
                .build());
        return jwtService.genererToken(utilisateurDetailsService.loadUserByUsername(email));
    }

    private String tokenExpire(String email) {
        SecretKey cle = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder().subject(email)
                .issuedAt(new Date(System.currentTimeMillis() - 7200_000))
                .expiration(new Date(System.currentTimeMillis() - 3600_000))
                .signWith(cle).compact();
    }

    @Test
    void tokenInvalide_surRoutePublique_repondCommeSansToken() throws Exception {
        String expire = tokenExpire("client-sec-expire@example.test");
        String malforme = "pas-un-token";
        String mauvaiseSignature = tokenClient.substring(0, tokenClient.length() - 1)
                + (tokenClient.endsWith("a") ? "b" : "a");

        mockMvc.perform(get("/api/produits"))
                .andExpect(status().isOk());

        for (String mauvais : new String[]{expire, malforme, mauvaiseSignature}) {
            mockMvc.perform(get("/api/produits").header("Authorization", "Bearer " + mauvais))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/images/11111111-2222-3333-4444-555555555555.jpg")
                            .header("Authorization", "Bearer " + mauvais))
                    .andExpect(status().isNotFound());
        }
    }

    @Test
    void volumes_estReserveAdmin_401SansToken_403AvecMauvaisRole() throws Exception {
        // D'après docs/api-contract.md : GET /api/collectes/volumes = rôle ADMIN, pas public.
        mockMvc.perform(get("/api/collectes/volumes"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(jsonPath("$.statut").value(401));

        mockMvc.perform(get("/api/collectes/volumes").header("Authorization", "Bearer " + tokenClient))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.statut").value(403));

        mockMvc.perform(get("/api/collectes/volumes").header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());
    }

    @Test
    void sansToken_401AvecBearer_avecMauvaisRole_403SansBearer() throws Exception {
        mockMvc.perform(get("/api/panier"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(jsonPath("$.statut").value(401));

        mockMvc.perform(get("/api/utilisateurs").header("Authorization", "Bearer " + tokenClient))
                .andExpect(status().isForbidden())
                .andExpect(resultat -> assertThat(resultat.getResponse().getHeader("WWW-Authenticate")).isNull());
    }

    @Test
    void login_garde401MetierEt423_sansEntreeAuthentification() throws Exception {
        String suffixe = String.valueOf(System.nanoTime());
        String email = "bloque-sec-" + suffixe + "@example.test";

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + email + "\",\"motDePasse\":\"MauvaisMotDePasse1\"}"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Email ou mot de passe incorrect"))
                    .andExpect(resultat -> assertThat(resultat.getResponse().getHeader("WWW-Authenticate")).isNull());
        }
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"motDePasse\":\"MauvaisMotDePasse1\"}"))
                .andExpect(status().isLocked());
    }

    @Test
    void preflightOptions_nEstJamaisIntercepte() throws Exception {
        mockMvc.perform(options("/api/panier")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "PUT"))
                .andExpect(resultat -> assertThat(resultat.getResponse().getStatus())
                        .isNotIn(401, 403));
    }
}
