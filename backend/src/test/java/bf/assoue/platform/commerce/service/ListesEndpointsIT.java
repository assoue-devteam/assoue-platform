package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.RoleRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.auth.service.JwtService;
import bf.assoue.platform.auth.service.UtilisateurDetailsService;
import bf.assoue.platform.collecte.dto.DeclarationCollecteRequest;
import bf.assoue.platform.collecte.dto.LocalisationRequest;
import bf.assoue.platform.collecte.model.Materiau;
import bf.assoue.platform.collecte.repository.MateriauRepository;
import bf.assoue.platform.collecte.service.CollecteService;
import bf.assoue.platform.commerce.dto.CommandeRequest;
import bf.assoue.platform.commerce.dto.LigneCommandeRequest;
import bf.assoue.platform.commerce.model.Avis;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.AvisRepository;
import bf.assoue.platform.commerce.repository.CategorieRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.stock.model.StockProduit;
import bf.assoue.platform.stock.repository.StockProduitRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
import java.util.UUID;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Listes sans LazyInitializationException avec open-in-view désactivé, et
 * charge en masse du catalogue (requêtes comptées via les statistiques Hibernate).
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@AutoConfigureMockMvc
class ListesEndpointsIT {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static final java.nio.file.Path IMAGES;

    static {
        try {
            IMAGES = java.nio.file.Files.createTempDirectory("listes-it");
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    @DynamicPropertySource
    static void proprietes(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("assoue.images.dossier", IMAGES::toString);
        registry.add("spring.jpa.properties.hibernate.generate_statistics", () -> "true");
    }

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ProduitService produitService;
    @Autowired
    private CommandeService commandeService;
    @Autowired
    private FavoriService favoriService;
    @Autowired
    private CollecteService collecteService;
    @Autowired
    private ProduitRepository produitRepository;
    @Autowired
    private CategorieRepository categorieRepository;
    @Autowired
    private StockProduitRepository stockProduitRepository;
    @Autowired
    private AvisRepository avisRepository;
    @Autowired
    private MateriauRepository materiauRepository;
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
    @Autowired
    private EntityManagerFactory producteurEntites;

    private String tokenClient;
    private String tokenCollecteur;
    private String tokenAdmin;
    private String emailClient;

    @BeforeEach
    void preparer() {
        String suffixe = String.valueOf(System.nanoTime());
        emailClient = "client-listes-" + suffixe + "@example.test";
        tokenClient = token(emailClient, "CLIENT");
        tokenCollecteur = token("collecteur-listes-" + suffixe + "@example.test", "COLLECTEUR");
        tokenAdmin = token("admin-listes-" + suffixe + "@example.test", "ADMIN");

        Categorie categorie = categorieRepository.save(Categorie.builder()
                .nom("Mobilier-" + suffixe).description("Test listes").build());
        List<Produit> produits = IntStream.range(0, 10).mapToObj(i -> produitRepository.save(Produit.builder()
                .nom("Produit " + i).description("Test listes")
                .prix(BigDecimal.valueOf(1000 + i)).categorie(categorie).build())).toList();
        produits.forEach(produit -> stockProduitRepository.save(
                StockProduit.builder().produit(produit).quantite(5).build()));
        Utilisateur client = utilisateurRepository.findByEmail(emailClient).orElseThrow();
        Produit premier = produits.get(0);
        avisRepository.save(Avis.builder().client(client).produit(premier).note((short) 5).build());
        avisRepository.save(Avis.builder().client(client).produit(produits.get(1)).note((short) 4).build());

        favoriService.ajouter(premier.getId(), emailClient);
        commandeService.creer(new CommandeRequest(List.of(new LigneCommandeRequest(premier.getId(), 1))), emailClient);

        Materiau materiau = materiauRepository.save(Materiau.builder()
                .nom("Plastique-" + suffixe).unite("kg").build());
        collecteService.declarer(new DeclarationCollecteRequest(UUID.randomUUID().toString(),
                materiau.getId(), new BigDecimal("15.5"), new LocalisationRequest(12.37, -1.52)),
                "collecteur-listes-" + suffixe + "@example.test");
    }

    private String token(String email, String role) {
        Role roleEntite = roleRepository.findByNom(role).orElseThrow();
        utilisateurRepository.save(Utilisateur.builder()
                .email(email)
                .motDePasse(passwordEncoder.encode("mot-de-passe"))
                .nom("Test").prenom("Listes")
                .roles(Set.of(roleEntite))
                .build());
        return jwtService.genererToken(utilisateurDetailsService.loadUserByUsername(email));
    }

    @Test
    void listes_publiquesEtPrivees_sansLazyInitializationException() throws Exception {
        mockMvc.perform(get("/api/produits")).andExpect(status().isOk());
        mockMvc.perform(get("/api/evenements")).andExpect(status().isOk());
        mockMvc.perform(get("/api/favoris").header("Authorization", "Bearer " + tokenClient))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/commandes/mes-commandes").header("Authorization", "Bearer " + tokenClient))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/collectes/mes-collectes").header("Authorization", "Bearer " + tokenCollecteur))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/collectes").header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());
    }

    @Test
    void lister_produits_chargeEnMasse() {
        var statistiques = producteurEntites.unwrap(SessionFactory.class).getStatistics();

        statistiques.clear();
        produitRepository.findByArchiveFalse().forEach(produitService::versReponse);
        long avant = statistiques.getQueryExecutionCount();

        statistiques.clear();
        assertThat(produitService.lister(null)).hasSizeGreaterThanOrEqualTo(10);
        long apres = statistiques.getQueryExecutionCount();

        assertThat(apres).as("requetes apres (avant : %d)", avant).isLessThanOrEqualTo(5);
        assertThat(apres).as("requêtes après (avant : %d)", avant).isLessThan(avant);
    }
}
