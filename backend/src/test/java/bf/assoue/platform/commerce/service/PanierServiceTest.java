package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.commerce.dto.LigneCommandeRequest;
import bf.assoue.platform.commerce.dto.PanierRequest;
import bf.assoue.platform.commerce.dto.PanierResponse;
import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.LignePanier;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.LignePanierRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.service.StockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PanierServiceTest {

    @Mock
    private LignePanierRepository lignePanierRepository;
    @Mock
    private ProduitRepository produitRepository;
    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private StockService stockService;
    @Mock
    private ProduitService produitService;

    @InjectMocks
    private PanierService panierService;

    private final Utilisateur client = Utilisateur.builder().id(1L).email("client@example.com").build();
    private final Produit pouf = Produit.builder()
            .id(5L).nom("Pouf").prix(BigDecimal.valueOf(25000))
            .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
            .build();

    @BeforeEach
    void setUp() {
        lenient().when(utilisateurRepository.findByEmail("client@example.com")).thenReturn(Optional.of(client));
        lenient().when(produitRepository.findById(5L)).thenReturn(Optional.of(pouf));
        lenient().when(produitService.versReponse(pouf))
                .thenReturn(new ProduitResponse(5L, "Pouf", null, BigDecimal.valueOf(25000), null, "Mobilier", false));
        lenient().when(lignePanierRepository.saveAll(any())).thenAnswer(appel -> appel.getArgument(0));
    }

    @Test
    void remplacer_regroupeLesLignesDuMemeProduitEtCalculeLeTotal() {
        when(stockService.quantiteDisponible(5L)).thenReturn(8);

        PanierResponse panier = panierService.remplacer(new PanierRequest(List.of(
                new LigneCommandeRequest(5L, 1), new LigneCommandeRequest(5L, 2))), "client@example.com");

        assertThat(panier.lignes()).singleElement().extracting(PanierResponse.LignePanierResponse::quantite).isEqualTo(3);
        assertThat(panier.total()).isEqualByComparingTo("75000");
        verify(lignePanierRepository).deleteByClientId(1L);
    }

    @Test
    void remplacer_videAvantDInsererPourNePasHeurterLUniciteClientProduit() {
        when(stockService.quantiteDisponible(5L)).thenReturn(8);

        panierService.remplacer(new PanierRequest(List.of(new LigneCommandeRequest(5L, 1))), "client@example.com");

        var ordre = inOrder(lignePanierRepository);
        ordre.verify(lignePanierRepository).deleteByClientId(1L);
        ordre.verify(lignePanierRepository).flush();
        ordre.verify(lignePanierRepository).saveAll(any());
    }

    @Test
    void remplacer_refuseUneQuantiteSuperieureAuStockDisponibleSansToucherAuPanier() {
        when(stockService.quantiteDisponible(5L)).thenReturn(2);

        assertThatThrownBy(() -> panierService.remplacer(
                new PanierRequest(List.of(new LigneCommandeRequest(5L, 3))), "client@example.com"))
                .isInstanceOf(RequeteInvalideException.class)
                .hasMessageContaining("2 disponible");

        verify(lignePanierRepository, never()).deleteByClientId(any());
        verify(lignePanierRepository, never()).saveAll(any());
    }

    @Test
    void remplacer_refuseUnProduitEnRupture() {
        when(stockService.quantiteDisponible(5L)).thenReturn(0);

        assertThatThrownBy(() -> panierService.remplacer(
                new PanierRequest(List.of(new LigneCommandeRequest(5L, 1))), "client@example.com"))
                .isInstanceOf(RequeteInvalideException.class);
    }

    @Test
    void remplacer_refuseUnProduitInconnu() {
        when(produitRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> panierService.remplacer(
                new PanierRequest(List.of(new LigneCommandeRequest(99L, 1))), "client@example.com"))
                .isInstanceOf(RessourceIntrouvableException.class);
        verify(lignePanierRepository, never()).deleteByClientId(any());
    }

    @Test
    void remplacer_avecUneListeVideVideLePanier() {
        PanierResponse panier = panierService.remplacer(new PanierRequest(List.of()), "client@example.com");

        assertThat(panier.lignes()).isEmpty();
        assertThat(panier.total()).isEqualByComparingTo("0");
        verify(lignePanierRepository).deleteByClientId(1L);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<LignePanier>> enregistrees = ArgumentCaptor.forClass(List.class);
        verify(lignePanierRepository).saveAll(enregistrees.capture());
        assertThat(enregistrees.getValue()).isEmpty();
    }

    @Test
    void consulter_renvoieLePanierDuClientAvecLePrixActuelDuProduit() {
        when(lignePanierRepository.findByClientEmailOrderByIdAsc("client@example.com"))
                .thenReturn(List.of(LignePanier.builder().client(client).produit(pouf).quantite(2).build()));

        PanierResponse panier = panierService.consulter("client@example.com");

        assertThat(panier.lignes()).singleElement()
                .satisfies(ligne -> assertThat(ligne.produit().prix()).isEqualByComparingTo("25000"));
        assertThat(panier.total()).isEqualByComparingTo("50000");
    }

}
