package bf.assoue.platform.commerce.service;

import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProduitServiceTest {

    @Mock
    private ProduitRepository produitRepository;
    @Mock
    private StockService stockService;

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

        when(produitRepository.findAll()).thenReturn(List.of(p1));
        when(stockService.estEnRupture(1L)).thenReturn(false);

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

        when(produitRepository.findById(2L)).thenReturn(Optional.of(p1));
        when(stockService.estEnRupture(2L)).thenReturn(true);

        ProduitResponse result = produitService.consulter(2L);

        assertThat(result.id()).isEqualTo(2L);
        assertThat(result.imageUrl()).isEqualTo("https://cdn.example.com/collier.jpg");
        assertThat(result.enRupture()).isTrue();
    }

    @Test
    void consulter_leveException_siInexistant() {
        when(produitRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.consulter(99L))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

}
