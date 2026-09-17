package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.commerce.dto.CommandeRequest;
import bf.assoue.platform.commerce.dto.LigneCommandeRequest;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.CommandeRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.stock.service.StockService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommandeServiceTest {

    @Mock
    private CommandeRepository commandeRepository;
    @Mock
    private ProduitRepository produitRepository;
    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private StockService stockService;

    @InjectMocks
    private CommandeService commandeService;

    @Test
    void creer_refuseLaCommande_siUnProduitEstEnRupture() {
        Produit produit = Produit.builder()
                .id(1L).nom("Chaise").prix(BigDecimal.valueOf(15000))
                .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
                .build();

        when(utilisateurRepository.findByEmail("client@example.com"))
                .thenReturn(Optional.of(Utilisateur.builder().id(1L).email("client@example.com").build()));
        when(produitRepository.findById(1L)).thenReturn(Optional.of(produit));
        when(stockService.estEnRupture(1L)).thenReturn(true);

        CommandeRequest requete = new CommandeRequest(List.of(new LigneCommandeRequest(1L, 2)));

        assertThatThrownBy(() -> commandeService.creer(requete, "client@example.com"))
                .isInstanceOf(RequeteInvalideException.class);
    }

}
