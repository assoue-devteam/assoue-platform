package bf.assoue.platform.paiement.service;

import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.RoleRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.auth.service.JwtService;
import bf.assoue.platform.auth.service.UtilisateurDetailsService;
import bf.assoue.platform.commerce.dto.CommandeRequest;
import bf.assoue.platform.commerce.dto.LigneCommandeRequest;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.CategorieRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.commerce.service.CommandeService;
import bf.assoue.platform.paiement.repository.PaiementRepository;
import bf.assoue.platform.stock.model.StockProduit;
import bf.assoue.platform.stock.repository.StockProduitRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Double-clic / double envoi sur "Payer" : un seul paiement est créé (unicité
 * commande_id, V6), le second appel reçoit un 409 explicite au lieu d'un 500.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@AutoConfigureMockMvc
class PaiementInitiationConcurrenceIT {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;
    @MockBean
    private PaydunyaClient paydunyaClient;
    @Autowired
    private CommandeService commandeService;
    @Autowired
    private PaiementRepository paiementRepository;
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private CategorieRepository categorieRepository;
    @Autowired
    private ProduitRepository produitRepository;
    @Autowired
    private StockProduitRepository stockProduitRepository;
    @Autowired
    private UtilisateurDetailsService utilisateurDetailsService;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void deuxInitiationsConcurrentes_unSeulPaiementCreeEtSecondRecoit409() throws Exception {
        String suffixe = String.valueOf(System.nanoTime());
        String email = "concurrence-" + suffixe + "@example.test";
        Role client = roleRepository.findByNom("CLIENT").orElseThrow();
        utilisateurRepository.save(Utilisateur.builder()
                .email(email)
                .motDePasse(passwordEncoder.encode("mot-de-passe"))
                .nom("Test")
                .prenom("Concurrence")
                .roles(Set.of(client))
                .build());
        Categorie categorie = categorieRepository.save(Categorie.builder()
                .nom("Mobilier-" + suffixe).description("Test concurrence").build());
        Produit produit = produitRepository.save(Produit.builder()
                .nom("Chaise test").description("Test concurrence")
                .prix(BigDecimal.valueOf(15000)).categorie(categorie).build());
        stockProduitRepository.save(StockProduit.builder().produit(produit).quantite(10).build());
        Long commandeId = commandeService
                .creer(new CommandeRequest(List.of(new LigneCommandeRequest(produit.getId(), 1))), email)
                .id();
        String token = jwtService.genererToken(utilisateurDetailsService.loadUserByUsername(email));

        // Les deux threads se retrouvent dans l'appel réseau avant d'écrire :
        // les deux lectures findByCommandeId ont donc lieu avant les deux écritures.
        CountDownLatch rendezVous = new CountDownLatch(2);
        AtomicLong compteur = new AtomicLong();
        when(paydunyaClient.creerInvoice(any(), anyString(), anyString())).thenAnswer(invocation -> {
            rendezVous.countDown();
            rendezVous.await(10, TimeUnit.SECONDS);
            long n = compteur.incrementAndGet();
            return new PaydunyaClient.InvoiceCree("tok-conc-" + n + "-" + System.nanoTime(),
                    "https://paydunya.test/invoice/" + n);
        });

        try (var executeur = Executors.newFixedThreadPool(2)) {
            List<Future<Integer>> futurs = executeur.invokeAll(List.of(
                    () -> statutInitier(commandeId, token),
                    () -> statutInitier(commandeId, token)));
            List<Integer> statuts = List.of(futurs.get(0).get(30, TimeUnit.SECONDS), futurs.get(1).get(30, TimeUnit.SECONDS));
            assertThat(statuts).containsExactlyInAnyOrder(200, 409);
        }
        assertThat(paiementRepository.findByCommandeId(commandeId)).isPresent();
    }

    private int statutInitier(Long commandeId, String token) throws Exception {
        return mockMvc.perform(post("/api/paiements/commandes/{commandeId}", commandeId)
                        .header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getStatus();
    }
}
