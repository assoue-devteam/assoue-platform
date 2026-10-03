package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.commerce.dto.AvisRequest;
import bf.assoue.platform.commerce.dto.AvisResponse;
import bf.assoue.platform.commerce.model.Avis;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.CommandeStatut;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.AvisRepository;
import bf.assoue.platform.commerce.repository.CommandeRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
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
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvisServiceTest {

    @Mock
    private AvisRepository avisRepository;
    @Mock
    private ProduitRepository produitRepository;
    @Mock
    private CommandeRepository commandeRepository;
    @Mock
    private UtilisateurRepository utilisateurRepository;

    @InjectMocks
    private AvisService avisService;

    private final Utilisateur client = Utilisateur.builder().id(1L).email("awa@example.com").prenom("Awa").nom("Ouedraogo").build();
    private final Produit pouf = Produit.builder()
            .id(5L).nom("Pouf").prix(BigDecimal.valueOf(25000))
            .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
            .build();

    @BeforeEach
    void setUp() {
        lenient().when(produitRepository.findById(5L)).thenReturn(Optional.of(pouf));
        lenient().when(utilisateurRepository.findByEmail("awa@example.com")).thenReturn(Optional.of(client));
        lenient().when(avisRepository.save(any(Avis.class))).thenAnswer(appel -> appel.getArgument(0));
    }

    @Test
    void donner_refuseUnClientQuiNAPasPayeCeProduit() {
        when(commandeRepository.aAchete(eq("awa@example.com"), eq(5L), any())).thenReturn(false);

        assertThatThrownBy(() -> avisService.donner(5L, new AvisRequest(5, "Super"), "awa@example.com"))
                .isInstanceOf(RequeteInvalideException.class)
                .hasMessageContaining("acheté et payé");
        verify(avisRepository, never()).save(any());
    }

    @Test
    void donner_neCompteQueLesCommandesPayees() {
        when(commandeRepository.aAchete(eq("awa@example.com"), eq(5L), any())).thenReturn(true);

        avisService.donner(5L, new AvisRequest(4, null), "awa@example.com");

        verify(commandeRepository).aAchete(eq("awa@example.com"), eq(5L), argThat(statuts ->
                statuts.contains(CommandeStatut.PAYEE) && statuts.contains(CommandeStatut.LIVREE)
                        && !statuts.contains(CommandeStatut.EN_ATTENTE_PAIEMENT) && !statuts.contains(CommandeStatut.ANNULEE)));
    }

    @Test
    void donner_creeLAvisAvecUnAuteurAbrege() {
        when(commandeRepository.aAchete(eq("awa@example.com"), eq(5L), any())).thenReturn(true);

        AvisResponse avis = avisService.donner(5L, new AvisRequest(5, "  Très solide  "), "awa@example.com");

        assertThat(avis.note()).isEqualTo(5);
        assertThat(avis.commentaire()).isEqualTo("Très solide");
        assertThat(avis.auteur()).isEqualTo("Awa O.");
    }

    @Test
    void donner_remplaceLAvisExistantAuLieuDEnCreerUnSecond() {
        Avis existant = Avis.builder().id(9L).client(client).produit(pouf).note((short) 2).commentaire("Bof").build();
        when(commandeRepository.aAchete(eq("awa@example.com"), eq(5L), any())).thenReturn(true);
        when(avisRepository.findByClientEmailAndProduitId("awa@example.com", 5L)).thenReturn(Optional.of(existant));

        avisService.donner(5L, new AvisRequest(4, ""), "awa@example.com");

        ArgumentCaptor<Avis> enregistre = ArgumentCaptor.forClass(Avis.class);
        verify(avisRepository).save(enregistre.capture());
        assertThat(enregistre.getValue().getId()).isEqualTo(9L);
        assertThat(enregistre.getValue().getNote()).isEqualTo((short) 4);
        assertThat(enregistre.getValue().getCommentaire()).isNull();
    }

    @Test
    void lister_renvoieMoyenneNombreEtAvis() {
        when(avisRepository.noteMoyenne(5L)).thenReturn(4.5);
        when(avisRepository.countByProduitId(5L)).thenReturn(2L);
        when(avisRepository.findByProduitIdOrderByDateCreationDesc(5L)).thenReturn(List.of(
                Avis.builder().client(client).produit(pouf).note((short) 5).build(),
                Avis.builder().client(Utilisateur.builder().email("x@example.com").build()).produit(pouf).note((short) 4).build()));

        AvisResponse.Liste liste = avisService.lister(5L);

        assertThat(liste.moyenne()).isEqualTo(4.5);
        assertThat(liste.nombre()).isEqualTo(2);
        assertThat(liste.avis()).extracting(AvisResponse::auteur).containsExactly("Awa O.", "Client AS'SOUÉ");
    }

    @Test
    void lister_refuseUnProduitInconnu() {
        when(produitRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> avisService.lister(99L)).isInstanceOf(RessourceIntrouvableException.class);
    }

}
