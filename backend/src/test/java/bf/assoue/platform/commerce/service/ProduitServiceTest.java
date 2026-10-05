package bf.assoue.platform.commerce.service;

import bf.assoue.platform.commerce.dto.ProduitRequest;
import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.AvisRepository;
import bf.assoue.platform.commerce.repository.CategorieRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.images.ImageService;
import bf.assoue.platform.images.SuppressionImageApresCommit;
import bf.assoue.platform.stock.service.StockService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProduitServiceTest {

    @Mock
    private ProduitRepository produitRepository;
    @Mock
    private CategorieRepository categorieRepository;
    @Mock
    private StockService stockService;
    @Mock
    private AvisRepository avisRepository;
    @Mock
    private ImageService imageService;
    @Mock
    private SuppressionImageApresCommit nettoyageImage;

    @InjectMocks
    private ProduitService produitService;

    @Test
    void lister_retourneProduitsAvecImageUrlEtStatutRupture() {
        Categorie categorie = Categorie.builder().id(1L).nom("Artisanat").build();
        Produit p1 = Produit.builder()
                .id(1L)
                .nom("Sac en cuir")
                .description("Beau sac")
                .prix(BigDecimal.valueOf(25000))
                .imageUrl("https://cdn.example.com/sac.jpg")
                .categorie(categorie)
                .build();

        when(produitRepository.findByArchiveFalse()).thenReturn(List.of(p1));
        when(stockService.rupturesParProduit(List.of(1L))).thenReturn(java.util.Map.of(1L, false));

        List<ProduitResponse> result = produitService.lister(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).imageUrl()).isEqualTo("https://cdn.example.com/sac.jpg");
        assertThat(result.get(0).enRupture()).isFalse();
        assertThat(result.get(0).categorie()).isEqualTo("Artisanat");
    }

    @Test
    void consulter_retourneProduit_siExistant() {
        Categorie categorie = Categorie.builder().id(2L).nom("Bijoux").build();
        Produit p1 = Produit.builder()
                .id(2L)
                .nom("Collier")
                .prix(BigDecimal.valueOf(10000))
                .imageUrl("https://cdn.example.com/collier.jpg")
                .categorie(categorie)
                .build();

        when(produitRepository.findByIdAndArchiveFalse(2L)).thenReturn(Optional.of(p1));
        when(stockService.estEnRupture(2L)).thenReturn(true);

        ProduitResponse result = produitService.consulter(2L);

        assertThat(result.id()).isEqualTo(2L);
        assertThat(result.imageUrl()).isEqualTo("https://cdn.example.com/collier.jpg");
        assertThat(result.enRupture()).isTrue();
    }

    @Test
    void consulter_leveException_siInexistant() {
        when(produitRepository.findByIdAndArchiveFalse(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.consulter(99L))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

    @Test
    void consulter_leveException_siArchive() {
        // Un produit archivé est introuvable côté public, comme s'il n'existait pas.
        when(produitRepository.findByIdAndArchiveFalse(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.consulter(5L))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

    @Test
    void definirVedette_metLeProduitEnAvantEtLeRenvoie() {
        Produit produit = Produit.builder()
                .id(4L).nom("Pouf").prix(BigDecimal.valueOf(25000))
                .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
                .build();
        when(produitRepository.findByIdAndArchiveFalse(4L)).thenReturn(Optional.of(produit));
        when(produitRepository.save(any(Produit.class))).thenAnswer(appel -> appel.getArgument(0));

        ProduitResponse reponse = produitService.definirVedette(4L, true);

        assertThat(reponse.vedette()).isTrue();
        assertThat(produit.isVedette()).isTrue();
    }

    @Test
    void definirVedette_refuseUnProduitInconnu() {
        when(produitRepository.findByIdAndArchiveFalse(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.definirVedette(99L, true))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

    @Test
    void creer_enregistreProduitEtStockInitialPuisDeriveLaRupture() {
        Categorie categorie = Categorie.builder().id(1L).nom("Mobilier").build();
        when(categorieRepository.findById(1L)).thenReturn(Optional.of(categorie));
        when(produitRepository.save(any(Produit.class))).thenAnswer(appel -> {
            Produit p = appel.getArgument(0);
            p.setId(20L);
            return p;
        });
        when(stockService.estEnRupture(20L)).thenReturn(false);

        ProduitResponse reponse = produitService.creer(new ProduitRequest(
                "Tabouret", 1L, 12000, "Tabouret en pneu", "https://cdn.example.com/tabouret.jpg", null, 5, true));

        assertThat(reponse.id()).isEqualTo(20L);
        assertThat(reponse.prix()).isEqualByComparingTo("12000");
        assertThat(reponse.vedette()).isTrue();
        verify(stockService).creerStockInitial(any(Produit.class), eq(5));
    }

    @Test
    void creer_sansStockInitialCreeUnStockAZeroDoncEnRupture() {
        Categorie categorie = Categorie.builder().id(1L).nom("Mobilier").build();
        when(categorieRepository.findById(1L)).thenReturn(Optional.of(categorie));
        when(produitRepository.save(any(Produit.class))).thenAnswer(appel -> {
            Produit p = appel.getArgument(0);
            p.setId(21L);
            return p;
        });
        when(stockService.estEnRupture(21L)).thenReturn(true);

        ProduitResponse reponse = produitService.creer(new ProduitRequest(
                "Tabouret", 1L, 12000, null, null, null, null, null));

        assertThat(reponse.enRupture()).isTrue();
        verify(stockService).creerStockInitial(any(Produit.class), eq(0));
    }

    @Test
    void creer_refuseUneCategorieInconnue() {
        when(categorieRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.creer(new ProduitRequest(
                "Tabouret", 99L, 12000, null, null, null, null, null)))
                .isInstanceOf(RessourceIntrouvableException.class);
        verify(produitRepository, never()).save(any());
    }

    @Test
    void modifier_metAJourProduitEtRemplaceLeStockQuandRenseigne() {
        Produit produit = Produit.builder()
                .id(4L).nom("Pouf").prix(BigDecimal.valueOf(25000))
                .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
                .build();
        when(produitRepository.findByIdAndArchiveFalse(4L)).thenReturn(Optional.of(produit));
        when(categorieRepository.findById(2L)).thenReturn(Optional.of(Categorie.builder().id(2L).nom("Bijoux").build()));
        when(produitRepository.save(any(Produit.class))).thenAnswer(appel -> appel.getArgument(0));

        ProduitResponse reponse = produitService.modifier(4L, new ProduitRequest(
                "Pouf retouche", 2L, 27000, "Neuf", null, null, 9, false));

        assertThat(reponse.nom()).isEqualTo("Pouf retouche");
        assertThat(reponse.categorie()).isEqualTo("Bijoux");
        verify(stockService).ajusterStockProduit(4L, 9);
    }

    @Test
    void modifier_sansStockQuantiteLaisseLeStockInchange() {
        Produit produit = Produit.builder()
                .id(4L).nom("Pouf").prix(BigDecimal.valueOf(25000))
                .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
                .build();
        when(produitRepository.findByIdAndArchiveFalse(4L)).thenReturn(Optional.of(produit));
        when(categorieRepository.findById(1L)).thenReturn(Optional.of(produit.getCategorie()));
        when(produitRepository.save(any(Produit.class))).thenAnswer(appel -> appel.getArgument(0));

        produitService.modifier(4L, new ProduitRequest("Pouf", 1L, 25000, null, null, null, null, null));

        verify(stockService, never()).ajusterStockProduit(any(), anyInt());
    }

    @Test
    void archiver_marqueLeProduitSansLeffacer() {
        Produit produit = Produit.builder()
                .id(4L).nom("Pouf").prix(BigDecimal.valueOf(25000))
                .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
                .build();
        when(produitRepository.findByIdAndArchiveFalse(4L)).thenReturn(Optional.of(produit));
        when(produitRepository.save(any(Produit.class))).thenAnswer(appel -> appel.getArgument(0));

        produitService.archiver(4L);

        assertThat(produit.isArchive()).isTrue();
        verify(produitRepository, never()).delete(any());
    }

    @Test
    void creer_avecImageCleLaExposeEtVideImageUrl() {
        Categorie categorie = Categorie.builder().id(1L).nom("Mobilier").build();
        when(categorieRepository.findById(1L)).thenReturn(Optional.of(categorie));
        when(produitRepository.save(any(Produit.class))).thenAnswer(appel -> {
            Produit p = appel.getArgument(0);
            p.setId(22L);
            return p;
        });
        when(stockService.estEnRupture(22L)).thenReturn(false);
        String cle = "11111111-2222-3333-4444-555555555555.jpg";
        when(imageService.validerCleExistante(cle)).thenReturn(cle);

        // imageCle et imageUrl ensemble : la clé l'emporte (documenté sur le DTO).
        ProduitResponse reponse = produitService.creer(new ProduitRequest(
                "Tabouret", 1L, 12000, null, "https://cdn.example.com/ancien.jpg", cle, null, false));

        assertThat(reponse.imageCle()).isEqualTo(cle);
        assertThat(reponse.imageUrl()).isEqualTo("/api/images/" + cle);
    }

    @Test
    void creer_refuseUneCleInconnue() {
        when(categorieRepository.findById(1L))
                .thenReturn(Optional.of(Categorie.builder().id(1L).nom("Mobilier").build()));
        when(imageService.validerCleExistante("inconnue.jpg"))
                .thenThrow(new RequeteInvalideException("Image introuvable."));

        assertThatThrownBy(() -> produitService.creer(new ProduitRequest(
                "Tabouret", 1L, 12000, null, null, "inconnue.jpg", null, false)))
                .isInstanceOf(RequeteInvalideException.class);
        verify(produitRepository, never()).save(any());
    }

    @Test
    void modifier_remplaceImageEtNettoieAncienFichier() {
        Produit produit = Produit.builder()
                .id(4L).nom("Pouf").prix(BigDecimal.valueOf(25000))
                .imageCle("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg")
                .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
                .build();
        when(produitRepository.findByIdAndArchiveFalse(4L)).thenReturn(Optional.of(produit));
        when(categorieRepository.findById(1L)).thenReturn(Optional.of(produit.getCategorie()));
        when(produitRepository.save(any(Produit.class))).thenAnswer(appel -> appel.getArgument(0));
        String nouvelle = "11111111-2222-3333-4444-555555555555.jpg";
        when(imageService.validerCleExistante(nouvelle)).thenReturn(nouvelle);

        produitService.modifier(4L, new ProduitRequest("Pouf", 1L, 25000, null, null, nouvelle, null, false));

        assertThat(produit.getImageCle()).isEqualTo(nouvelle);
        assertThat(produit.getImageUrl()).isNull();
        verify(nettoyageImage).supprimer("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg");
    }

    @Test
    void archiver_gardeLeFichierImage() {
        Produit produit = Produit.builder()
                .id(4L).nom("Pouf").prix(BigDecimal.valueOf(25000))
                .imageCle("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg")
                .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
                .build();
        when(produitRepository.findByIdAndArchiveFalse(4L)).thenReturn(Optional.of(produit));
        when(produitRepository.save(any(Produit.class))).thenAnswer(appel -> appel.getArgument(0));

        produitService.archiver(4L);

        assertThat(produit.isArchive()).isTrue();
        verify(nettoyageImage, never()).supprimer(any());
    }

}
