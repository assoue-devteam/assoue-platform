package bf.assoue.platform.auth.controller;

import bf.assoue.platform.auth.model.CodeReinitialisation;
import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.CodeReinitialisationRepository;
import bf.assoue.platform.auth.repository.JetonResetRepository;
import bf.assoue.platform.auth.repository.RoleRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.auth.service.JwtService;
import bf.assoue.platform.auth.service.UtilisateurDetailsService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@AutoConfigureMockMvc
class MotDePasseOublieIT {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void proprietes(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private CodeReinitialisationRepository codeRepository;
    @Autowired private JetonResetRepository jetonResetRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UtilisateurDetailsService utilisateurDetailsService;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ObjectMapper objectMapper;

    private static final String CLE_HMAC = "test-cle-hmac-pour-tests-uniquement";

    @BeforeEach
    void nettoyer() {
        jetonResetRepository.deleteAll();
        codeRepository.deleteAll();
        utilisateurRepository.deleteAll();
    }

    @Test
    void demande_reponseUniforme_quandCompteInconnu() throws Exception {
        MvcResult resultat = mockMvc.perform(post("/api/auth/mot-de-passe-oublie/demande")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"inconnu@example.com\"}")
                        .with(request -> {
                            request.setRemoteAddr("10.0.0.1");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode corps = objectMapper.readTree(resultat.getResponse().getContentAsString());
        assertThat(corps.get("message").asText()).contains("Si un compte existe");
    }

    @Test
    void demande_reponseUniforme_quandAdmin() throws Exception {
        creerUtilisateur("admin@assoue.bf", "ADMIN");

        MvcResult resultat = mockMvc.perform(post("/api/auth/mot-de-passe-oublie/demande")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@assoue.bf\"}")
                        .with(request -> {
                            request.setRemoteAddr("10.0.0.2");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode corps = objectMapper.readTree(resultat.getResponse().getContentAsString());
        assertThat(corps.get("message").asText()).contains("Si un compte existe");
    }

    @Test
    void demande_rateLimitIp_429Apres5Requetes() throws Exception {
        String ip = "10.0.0.3";
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/mot-de-passe-oublie/demande")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"client" + i + "@example.com\"}")
                    .with(request -> {
                        request.setRemoteAddr(ip);
                        return request;
                    }));
        }

        mockMvc.perform(post("/api/auth/mot-de-passe-oublie/demande")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"client6@example.com\"}")
                        .with(request -> {
                            request.setRemoteAddr(ip);
                            return request;
                        }))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void parcoursComplet_codeCorrect_thenJeton_thenReinitialisation() throws Exception {
        String email = "client@example.com";
        creerUtilisateur(email, "CLIENT");
        String code = "123456";
        sauvegarderCode(email, code, 5);

        MvcResult verification = mockMvc.perform(post("/api/auth/mot-de-passe-oublie/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode corpsVerification = objectMapper.readTree(verification.getResponse().getContentAsString());
        String jeton = corpsVerification.get("jeton").asText();

        mockMvc.perform(post("/api/auth/mot-de-passe-oublie/reinitialisation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"" + jeton + "\",\"nouveauMotDePasse\":\"NouveauPass123\"}"))
                .andExpect(status().isOk());

        Utilisateur modifie = utilisateurRepository.findByEmail(email).orElseThrow();
        assertThat(passwordEncoder.matches("NouveauPass123", modifie.getMotDePasse())).isTrue();
        assertThat(modifie.getMotDePasseModifieLe()).isNotNull();
    }

    @Test
    void verification_mauvaisCode_leveErreur() throws Exception {
        String email = "client@example.com";
        creerUtilisateur(email, "CLIENT");
        sauvegarderCode(email, "123456", 5);

        mockMvc.perform(post("/api/auth/mot-de-passe-oublie/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"000000\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void verification_codeExpiré_leveErreur() throws Exception {
        String email = "client@example.com";
        creerUtilisateur(email, "CLIENT");
        sauvegarderCode(email, "123456", 5, LocalDateTime.now().minusMinutes(1));

        mockMvc.perform(post("/api/auth/mot-de-passe-oublie/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"123456\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void verification_epuisementEssais_invalideLeCode() throws Exception {
        String email = "client@example.com";
        creerUtilisateur(email, "CLIENT");
        sauvegarderCode(email, "123456", 1);

        mockMvc.perform(post("/api/auth/mot-de-passe-oublie/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"000000\"}"))
                .andExpect(status().isBadRequest());

        CodeReinitialisation code = codeRepository.findAll().get(0);
        assertThat(code.isConsomme()).isTrue();
    }

    @Test
    void reinitialisation_jetonReutilise_leveErreur() throws Exception {
        String email = "client@example.com";
        creerUtilisateur(email, "CLIENT");
        String code = "123456";
        sauvegarderCode(email, code, 5);

        MvcResult verification = mockMvc.perform(post("/api/auth/mot-de-passe-oublie/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode corpsVerification = objectMapper.readTree(verification.getResponse().getContentAsString());
        String jeton = corpsVerification.get("jeton").asText();

        mockMvc.perform(post("/api/auth/mot-de-passe-oublie/reinitialisation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"" + jeton + "\",\"nouveauMotDePasse\":\"NouveauPass123\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/mot-de-passe-oublie/reinitialisation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"" + jeton + "\",\"nouveauMotDePasse\":\"AutrePass123\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void tokenReset_refuseSurEndpointNormal() throws Exception {
        String email = "client@example.com";
        creerUtilisateur(email, "CLIENT");
        String tokenReset = jwtService.genererJetonReset(email, "jti-test", 300_000L);

        mockMvc.perform(get("/api/commandes/mes-commandes")
                        .header("Authorization", "Bearer " + tokenReset))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenAvantChangementMotDePasse_refuseApresReinitialisation() throws Exception {
        String email = "client@example.com";
        creerUtilisateur(email, "CLIENT");
        String tokenAvant = jwtService.genererToken(utilisateurDetailsService.loadUserByUsername(email));

        String code = "123456";
        sauvegarderCode(email, code, 5);

        MvcResult verification = mockMvc.perform(post("/api/auth/mot-de-passe-oublie/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode corpsVerification = objectMapper.readTree(verification.getResponse().getContentAsString());
        String jeton = corpsVerification.get("jeton").asText();

        mockMvc.perform(post("/api/auth/mot-de-passe-oublie/reinitialisation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"" + jeton + "\",\"nouveauMotDePasse\":\"NouveauPass123\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/commandes/mes-commandes")
                        .header("Authorization", "Bearer " + tokenAvant))
                .andExpect(status().isUnauthorized());
    }

    private void creerUtilisateur(String email, String roleNom) {
        Role role = roleRepository.findByNom(roleNom).orElseThrow();
        utilisateurRepository.save(Utilisateur.builder()
                .email(email)
                .motDePasse(passwordEncoder.encode("AncienPass123"))
                .nom("Test").prenom("Client")
                .roles(Set.of(role))
                .build());
    }

    private void sauvegarderCode(String email, String code, int essais) {
        sauvegarderCode(email, code, essais, LocalDateTime.now().plusMinutes(10));
    }

    private void sauvegarderCode(String email, String code, int essais, LocalDateTime expiration) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElseThrow();
        codeRepository.save(CodeReinitialisation.builder()
                .utilisateur(utilisateur)
                .codeHache(hmac(code))
                .dateExpiration(expiration)
                .essaisRestants(essais)
                .consomme(false)
                .build());
    }

    private String hmac(String valeur) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(CLE_HMAC.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(valeur.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
