package bf.assoue.platform.images;

import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.RoleRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.auth.service.JwtService;
import bf.assoue.platform.auth.service.UtilisateurDetailsService;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.CategorieRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.communaute.model.Evenement;
import bf.assoue.platform.communaute.repository.EvenementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Upload et lecture d'images de bout en bout : sécurité réelle (sans token et
 * mauvais rôle refusés), validation serveur, nettoyage des anciens fichiers.
 *
 * Note : sans token l'API renvoie 403 (pas d'AuthenticationEntryPoint dédié,
 * comportement documenté dans api-contract.md), comme tous les endpoints protégés.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@AutoConfigureMockMvc
class ImageEndpointsIT {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static final Path IMAGES;

    static {
        try {
            IMAGES = Files.createTempDirectory("images-it");
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
        registry.add("spring.servlet.multipart.max-file-size", () -> "100KB");
        registry.add("spring.servlet.multipart.max-request-size", () -> "1MB");
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
    @Autowired
    private CategorieRepository categorieRepository;
    @Autowired
    private ProduitRepository produitRepository;
    @Autowired
    private EvenementRepository evenementRepository;

    private String tokenAdmin;
    private String tokenClient;

    @BeforeEach
    void authentifier() {
        String suffixe = String.valueOf(System.nanoTime());
        tokenAdmin = token("admin-img-" + suffixe + "@example.test", "ADMIN");
        tokenClient = token("client-img-" + suffixe + "@example.test", "CLIENT");
    }

    private String token(String email, String role) {
        Role roleEntite = roleRepository.findByNom(role).orElseThrow();
        utilisateurRepository.save(Utilisateur.builder()
                .email(email)
                .motDePasse(passwordEncoder.encode("mot-de-passe"))
                .nom("Test").prenom("Image")
                .roles(Set.of(roleEntite))
                .build());
        return jwtService.genererToken(utilisateurDetailsService.loadUserByUsername(email));
    }

    @Test
    void envoiSansToken_etAvecMauvaisRole_sontRefuses() throws Exception {
        MockMultipartFile fichier = new MockMultipartFile("fichier", "photo.jpg", "image/jpeg", jpeg());

        mockMvc.perform(multipart("/api/images").file(fichier))
                .andExpect(status().isForbidden());

        mockMvc.perform(multipart("/api/images").file(fichier)
                        .header("Authorization", "Bearer " + tokenClient))
                .andExpect(status().isForbidden());
    }

    @Test
    void envoiValide_renvoieUneCleEtStockeUnFichierReencode() throws Exception {
        String cle = envoyer("photo.jpg", jpeg());

        assertThat(cle).matches(CleImage.REGEX_CHEMIN);
        Path stocke = IMAGES.resolve(cle);
        assertThat(stocke).exists();
        byte[] octets = Files.readAllBytes(stocke);
        assertThat(octets[0]).isEqualTo((byte) 0xFF);
        assertThat(octets[1]).isEqualTo((byte) 0xD8);

        mockMvc.perform(get("/api/images/{cle}", cle))
                .andExpect(status().isOk())
                .andExpect(resultat -> assertThat(resultat.getResponse().getContentType()).isEqualTo("image/jpeg"))
                .andExpect(resultat -> assertThat(resultat.getResponse().getHeader("Cache-Control")).contains("immutable"));
    }

    @Test
    void envoiTropGros_renvoie413AvecMessageClair() throws Exception {
        byte[] gros = new byte[200 * 1024];

        mockMvc.perform(multipart("/api/images")
                        .file(new MockMultipartFile("fichier", "gros.jpg", "image/jpeg", gros))
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.message").value("L'image dépasse 100 Ko."));
    }

    @Test
    void contenuNonImageAvecExtensionJpg_renvoie415() throws Exception {
        mockMvc.perform(multipart("/api/images")
                        .file(new MockMultipartFile("fichier", "photo.jpg", "image/jpeg",
                                "ceci n'est pas une image".getBytes(StandardCharsets.UTF_8)))
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void nomDeFichierMalveillant_estNeutralise() throws Exception {
        String cle = envoyer("../../etc/pirate.jpg", jpeg());

        assertThat(cle).matches(CleImage.REGEX_CHEMIN);
        assertThat(IMAGES.resolve(cle)).exists();
    }

    @Test
    void lectureCleInconnue_traversalEtSeparateurEncode_sontRejetees() throws Exception {
        mockMvc.perform(get("/api/images/{cle}", "11111111-2222-3333-4444-555555555555.jpg"))
                .andExpect(status().isNotFound());

        // Tentatives de sortie du dossier : rejetées avant tout accès fichier (400 ou 404 selon l'étage).
        mockMvc.perform(get("/api/images/../application.yml"))
                .andExpect(status().is4xxClientError());

        mockMvc.perform(get("/api/images/%2e%2e%2fsecret.jpg"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void produit_accepteLaCleEtLaCleLemporteSurUrl() throws Exception {
        String cle = envoyer("photo.jpg", jpeg());
        Long categorieId = categorie("Mobilier-" + System.nanoTime());

        MvcResult creation = mockMvc.perform(post("/api/produits")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nom":"Tabouret","categorieId":%d,"prix":12000,
                                 "imageUrl":"https://cdn.example.com/ancien.jpg","imageCle":"%s"}"""
                                .formatted(categorieId, cle)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imageCle").value(cle))
                .andExpect(jsonPath("$.imageUrl").value("/api/images/" + cle))
                .andReturn();
        long produitId = Long.parseLong(champ(creation.getResponse().getContentAsString(), "id"));

        // URL legacy seule : affichée telle quelle, imageCle nulle.
        mockMvc.perform(put("/api/produits/{id}", produitId)
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nom":"Tabouret","categorieId":%d,"prix":12000,
                                 "imageUrl":"https://cdn.example.com/ancien.jpg","imageCle":null}"""
                                .formatted(categorieId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value("https://cdn.example.com/ancien.jpg"))
                .andExpect(jsonPath("$.imageCle", org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void produit_changementImageSupprimeAncienFichierEtArchivageLeGarde() throws Exception {
        String ancienne = envoyer("a.jpg", jpeg());
        String nouvelle = envoyer("b.jpg", jpeg());
        Long categorieId = categorie("Mobilier-" + System.nanoTime());
        Produit produit = produitRepository.save(Produit.builder()
                .nom("Tabouret").description("Test").prix(BigDecimal.valueOf(12000))
                .imageCle(ancienne)
                .categorie(categorieRepository.findById(categorieId).orElseThrow())
                .build());

        mockMvc.perform(put("/api/produits/{id}", produit.getId())
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nom":"Tabouret","categorieId":%d,"prix":12000,"imageCle":"%s"}"""
                                .formatted(categorieId, nouvelle)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value("/api/images/" + nouvelle));

        assertThat(IMAGES.resolve(ancienne)).doesNotExist();
        assertThat(IMAGES.resolve(nouvelle)).exists();

        // Archivage (suppression logique) : le fichier reste, l'historique l'affiche encore.
        mockMvc.perform(delete("/api/produits/{id}", produit.getId())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isNoContent());
        assertThat(IMAGES.resolve(nouvelle)).exists();
    }

    @Test
    void evenement_suppressionPhysiqueNettoieLeFichier() throws Exception {
        String cle = envoyer("fete.jpg", jpeg());
        Evenement evenement = evenementRepository.save(Evenement.builder()
                .titre("Atelier").dateDebut(LocalDateTime.of(2026, 12, 15, 9, 0))
                .lieu("Ouaga").imageCle(cle).build());

        mockMvc.perform(delete("/api/evenements/{id}", evenement.getId())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isNoContent());

        assertThat(IMAGES.resolve(cle)).doesNotExist();
    }

    private String envoyer(String nom, byte[] contenu) throws Exception {
        MvcResult resultat = mockMvc.perform(multipart("/api/images")
                        .file(new MockMultipartFile("fichier", nom, "image/jpeg", contenu))
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isCreated())
                .andReturn();
        String corps = resultat.getResponse().getContentAsString();
        return corps.replaceAll(".*\"cle\"\\s*:\\s*\"([^\"]+)\".*", "$1");
    }

    private Long categorie(String nom) {
        return categorieRepository.save(Categorie.builder().nom(nom).description("Test images").build()).getId();
    }

    private static String champ(String corps, String nom) {
        return corps.replaceAll("(?s).*\"" + nom + "\"\\s*:\\s*\"?([^\",}]+)\"?.*", "$1");
    }

    private static byte[] jpeg() throws Exception {
        BufferedImage dessin = new BufferedImage(8, 6, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ImageIO.write(dessin, "JPEG", sortie);
        return sortie.toByteArray();
    }
}
