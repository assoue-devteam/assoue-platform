package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.commerce.dto.CommandeAdminResponse;
import bf.assoue.platform.commerce.dto.CommandeEnAttenteResponse;
import bf.assoue.platform.commerce.dto.CommandeRequest;
import bf.assoue.platform.commerce.dto.CommandeResponse;
import bf.assoue.platform.commerce.dto.LigneCommandeRequest;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;
import bf.assoue.platform.commerce.model.LigneCommande;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.CommandeRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.service.StockService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

    @Test
    void enAttenteDepuis_remonteLancienneteDeLaCommandeNonPayee() {
        Produit produit = Produit.builder()
                .id(1L).nom("Chaise").prix(BigDecimal.valueOf(15000))
                .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
                .build();

        Commande commande = Commande.builder()
                .id(10L)
                .client(Utilisateur.builder().id(1L).email("client@example.com").build())
                .dateCreation(LocalDateTime.now().minusHours(30))
                .build();
        commande.getLignes().add(LigneCommande.builder()
                .commande(commande).produit(produit).quantite(2).prixUnitaire(produit.getPrix()).build());

        when(commandeRepository.findByStatutAndDateCreationBeforeOrderByDateCreationAsc(
                eq(CommandeStatut.EN_ATTENTE_PAIEMENT), any())).thenReturn(List.of(commande));

        List<CommandeEnAttenteResponse> enAttente = commandeService.enAttenteDepuis(24);

        assertThat(enAttente).singleElement().satisfies(alerte -> {
            assertThat(alerte.clientEmail()).isEqualTo("client@example.com");
            assertThat(alerte.heuresDAttente()).isGreaterThanOrEqualTo(30);
            assertThat(alerte.total()).isEqualByComparingTo("30000");
        });
    }

    @Test
    void consulter_laisseLeManagerVoirLaCommandeDunAutreClient() {
        Commande commande = commandeDe("client@example.com");
        when(commandeRepository.findById(10L)).thenReturn(Optional.of(commande));

        assertThat(commandeService.consulter(10L, "manager@example.com", true).id()).isEqualTo(10L);
    }

    @Test
    void consulter_cacheAuClientLaCommandeDunTiers() {
        when(commandeRepository.findById(10L)).thenReturn(Optional.of(commandeDe("client@example.com")));

        assertThatThrownBy(() -> commandeService.consulter(10L, "intrus@example.com", false))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

    @Test
    void lister_filtreSurLeStatutDemande() {
        when(commandeRepository.findByStatutOrderByDateCreationDesc(CommandeStatut.EN_ATTENTE_PAIEMENT))
                .thenReturn(List.of(commandeDe("client@example.com")));

        List<CommandeAdminResponse> commandes = commandeService.lister(CommandeStatut.EN_ATTENTE_PAIEMENT);

        assertThat(commandes).singleElement().satisfies(vue -> {
            assertThat(vue.clientEmail()).isEqualTo("client@example.com");
            assertThat(vue.statut()).isEqualTo(CommandeStatut.EN_ATTENTE_PAIEMENT);
            assertThat(vue.total()).isEqualByComparingTo("30000");
        });
    }

    @Test
    void listerPourClient_renvoieLesCommandesDuClient() {
        when(commandeRepository.findByClientEmailOrderByDateCreationDesc("client@example.com"))
                .thenReturn(List.of(commandeDe("client@example.com")));

        List<CommandeResponse> commandes = commandeService.listerPourClient("client@example.com");

        assertThat(commandes).singleElement().satisfies(vue -> {
            assertThat(vue.id()).isEqualTo(10L);
            assertThat(vue.statut()).isEqualTo(CommandeStatut.EN_ATTENTE_PAIEMENT);
            assertThat(vue.total()).isEqualByComparingTo("30000");
        });
    }

    private Commande commandeDe(String emailClient) {
        Produit produit = Produit.builder()
                .id(1L).nom("Chaise").prix(BigDecimal.valueOf(15000))
                .categorie(Categorie.builder().id(1L).nom("Mobilier").build())
                .build();

        Commande commande = Commande.builder()
                .id(10L)
                .client(Utilisateur.builder().id(1L).email(emailClient).build())
                .build();
        commande.getLignes().add(LigneCommande.builder()
                .commande(commande).produit(produit).quantite(2).prixUnitaire(produit.getPrix()).build());

        return commande;
    }

}
