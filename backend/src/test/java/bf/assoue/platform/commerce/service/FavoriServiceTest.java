package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Favori;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.FavoriRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriServiceTest {

    @Mock
    private FavoriRepository favoriRepository;
    @Mock
    private ProduitRepository produitRepository;
    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private ProduitService produitService;

    @InjectMocks
    private FavoriService favoriService;

    private final Utilisateur client = Utilisateur.builder().id(1L).email("client@example.com").build();
    private final Produit pouf = Produit.builder()
            .id(5L).nom("Pouf").prix(BigDecimal.valueOf(25000))
            .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
            .build();

    @Test
    void ajouter_enregistreLeFavori() {
        when(utilisateurRepository.findByEmail("client@example.com")).thenReturn(Optional.of(client));
        when(produitRepository.findById(5L)).thenReturn(Optional.of(pouf));

        favoriService.ajouter(5L, "client@example.com");

        verify(favoriRepository).save(any(Favori.class));
    }

    @Test
    void ajouter_deuxFoisNeCreePasDeDoublon() {
        when(utilisateurRepository.findByEmail("client@example.com")).thenReturn(Optional.of(client));
        when(produitRepository.findById(5L)).thenReturn(Optional.of(pouf));
        when(favoriRepository.existsByClientIdAndProduitId(1L, 5L)).thenReturn(true);

        favoriService.ajouter(5L, "client@example.com");

        verify(favoriRepository, never()).save(any());
    }

    @Test
    void ajouter_refuseUnProduitInconnu() {
        when(utilisateurRepository.findByEmail("client@example.com")).thenReturn(Optional.of(client));
        when(produitRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriService.ajouter(99L, "client@example.com"))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

    @Test
    void lister_renvoieLesProduitsAvecLeurEtatActuel() {
        ProduitResponse reponse = new ProduitResponse(5L, "Pouf", null, BigDecimal.valueOf(25000), null, "Mobilier", true, false, null, 0);
        when(favoriRepository.findByClientEmailOrderByDateAjoutDesc("client@example.com"))
                .thenReturn(List.of(Favori.builder().client(client).produit(pouf).build()));
        when(produitService.versReponse(pouf)).thenReturn(reponse);

        assertThat(favoriService.lister("client@example.com")).containsExactly(reponse);
    }

}
