package bf.assoue.platform.auth.service;

import bf.assoue.platform.auth.dto.LoginRequest;
import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.RoleRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.common.exception.CompteBloqueException;
import bf.assoue.platform.common.exception.IdentifiantsInvalidesException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class AuthServiceTransactionIT {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private AuthService authService;
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Test
    void persisteLesEchecsPuisBloqueLeCompteEtReinitialiseApresUnSucces() {
        String email = "transaction-" + System.nanoTime() + "@example.test";
        creerUtilisateur(email, 0);

        for (int tentative = 1; tentative <= 3; tentative++) {
            assertThatThrownBy(() -> authService.connecter(new LoginRequest(email, "mauvais")))
                    .isInstanceOf(IdentifiantsInvalidesException.class);
            assertThat(utilisateurRepository.findByEmail(email).orElseThrow().getTentativesEchouees())
                    .isEqualTo(tentative);
        }
        assertThatThrownBy(() -> authService.connecter(new LoginRequest(email, "mot-de-passe")))
                .isInstanceOf(CompteBloqueException.class);

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElseThrow();
        utilisateur.setTentativesEchouees(2);
        utilisateurRepository.save(utilisateur);
        authService.connecter(new LoginRequest(email, "mot-de-passe"));
        assertThat(utilisateurRepository.findByEmail(email).orElseThrow().getTentativesEchouees()).isZero();
    }

    @Test
    void borneLeCompteurALimiteSousConnexionsConcurrentes() throws Exception {
        String email = "concurrent-" + System.nanoTime() + "@example.test";
        creerUtilisateur(email, 0);
        try (var executeur = Executors.newFixedThreadPool(5)) {
            var resultats = executeur.invokeAll(java.util.stream.IntStream.range(0, 5)
                    .<Callable<Class<? extends RuntimeException>>>mapToObj(index -> () -> {
                        try {
                            authService.connecter(new LoginRequest(email, "mauvais"));
                            return null;
                        } catch (RuntimeException ex) {
                            return ex.getClass();
                        }
                    }).toList());
            assertThat(resultats).hasSize(5);
        }
        assertThat(utilisateurRepository.findByEmail(email).orElseThrow().getTentativesEchouees()).isEqualTo(3);
    }

    private void creerUtilisateur(String email, int tentatives) {
        Role client = roleRepository.findByNom("CLIENT").orElseThrow();
        utilisateurRepository.save(Utilisateur.builder()
                .email(email)
                .motDePasse(passwordEncoder.encode("mot-de-passe"))
                .nom("Test")
                .prenom("Transaction")
                .tentativesEchouees(tentatives)
                .roles(Set.of(client))
                .build());
    }
}
