package bf.assoue.platform.stock.service;

import bf.assoue.platform.collecte.model.Materiau;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.dto.StockMatierePremiereResponse;
import bf.assoue.platform.stock.dto.StockProduitResponse;
import bf.assoue.platform.stock.model.StockMatierePremiere;
import bf.assoue.platform.stock.model.StockProduit;
import bf.assoue.platform.stock.repository.StockMatierePremiereRepository;
import bf.assoue.platform.stock.repository.StockProduitRepository;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private StockProduitRepository stockProduitRepository;
    @Mock
    private StockMatierePremiereRepository stockMatierePremiereRepository;

    @InjectMocks
    private StockService stockService;

    @Test
    void listerStocksProduits_retourneTousLesStocks() {
        Produit p = Produit.builder().id(1L).nom("Chaise").build();
        StockProduit sp = StockProduit.builder().id(10L).produit(p).quantite(15).build();

        when(stockProduitRepository.findAll()).thenReturn(List.of(sp));

        List<StockProduitResponse> result = stockService.listerStocksProduits();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).produitId()).isEqualTo(1L);
        assertThat(result.get(0).quantite()).isEqualTo(15);
    }

    @Test
    void listerStocksMatieresPremieres_retourneTousLesStocks() {
        Materiau m = Materiau.builder().id(2L).nom("Plastique PET").build();
        StockMatierePremiere smp = StockMatierePremiere.builder().id(20L).materiau(m).quantite(BigDecimal.valueOf(120.5)).build();

        when(stockMatierePremiereRepository.findAll()).thenReturn(List.of(smp));

        List<StockMatierePremiereResponse> result = stockService.listerStocksMatieresPremieres();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).materiauId()).isEqualTo(2L);
        assertThat(result.get(0).quantite()).isEqualByComparingTo("120.5");
    }

    @Test
    void ajusterStockProduit_modifieLaQuantiteEtSauvegarde() {
        Produit p = Produit.builder().id(1L).nom("Chaise").build();
        StockProduit sp = StockProduit.builder().id(10L).produit(p).quantite(5).build();

        when(stockProduitRepository.findByProduitId(1L)).thenReturn(Optional.of(sp));
        when(stockProduitRepository.save(any(StockProduit.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockProduitResponse result = stockService.ajusterStockProduit(1L, 25);

        assertThat(result.quantite()).isEqualTo(25);
        assertThat(sp.getQuantite()).isEqualTo(25);
        verify(stockProduitRepository).save(sp);
    }

    @Test
    void ajusterStockProduit_leveExceptionSiInexistant() {
        when(stockProduitRepository.findByProduitId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stockService.ajusterStockProduit(99L, 10))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

    @Test
    void decrementerStockProduit_reduitLaQuantite() {
        Produit p = Produit.builder().id(1L).nom("Chaise").build();
        StockProduit sp = StockProduit.builder().id(10L).produit(p).quantite(10).build();

        when(stockProduitRepository.findByProduitId(1L)).thenReturn(Optional.of(sp));

        stockService.decrementerStockProduit(1L, 3);

        assertThat(sp.getQuantite()).isEqualTo(7);
        verify(stockProduitRepository).save(sp);
    }

    @Test
    void decrementerStockProduit_refuseSiQuantiteInsuffisante() {
        Produit p = Produit.builder().id(1L).nom("Chaise").build();
        StockProduit sp = StockProduit.builder().id(10L).produit(p).quantite(2).build();

        when(stockProduitRepository.findByProduitId(1L)).thenReturn(Optional.of(sp));

        assertThatThrownBy(() -> stockService.decrementerStockProduit(1L, 5))
                .isInstanceOf(RequeteInvalideException.class)
                .hasMessageContaining("insuffisant");
    }

    @Test
    void incrementerStockMatierePremiere_ajouteALExistant() {
        Materiau m = Materiau.builder().id(2L).nom("Plastique PET").build();
        StockMatierePremiere smp = StockMatierePremiere.builder().id(20L).materiau(m).quantite(BigDecimal.valueOf(50)).build();

        when(stockMatierePremiereRepository.findByMateriauId(2L)).thenReturn(Optional.of(smp));

        stockService.incrementerStockMatierePremiere(m, BigDecimal.valueOf(25.5));

        assertThat(smp.getQuantite()).isEqualByComparingTo("75.5");
        verify(stockMatierePremiereRepository).save(smp);
    }

}
