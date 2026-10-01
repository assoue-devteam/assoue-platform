package bf.assoue.platform.paiement.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;
import bf.assoue.platform.commerce.model.LigneCommande;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.CommandeRepository;
import bf.assoue.platform.common.exception.PaiementDejaInitieException;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.paiement.dto.PaiementResponse;
import bf.assoue.platform.paiement.dto.PaiementSuperviseResponse;
import bf.assoue.platform.paiement.dto.PaydunyaWebhook;
import bf.assoue.platform.paiement.model.Paiement;
import bf.assoue.platform.paiement.model.PaiementStatut;
import bf.assoue.platform.paiement.repository.PaiementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaiementServiceTest {

    @Mock private PaiementRepository paiementRepository;
    @Mock private CommandeRepository commandeRepository;
    @Mock private PaydunyaClient paydunyaClient;
    @Mock private PaydunyaProperties paydunyaProperties;
    @Mock private PaydunyaSignatureVerifier paydunyaSignatureVerifier;
    @Mock private PaiementFinalisationService paiementFinalisationService;
    @InjectMocks private PaiementService paiementService;

    @Test
    void traiterWebhook_verifiePuisRevalideEtFinalise() {
        PaydunyaWebhook webhook = new PaydunyaWebhook("tok_123", "completed", "signature");
        PaydunyaClient.Confirmation confirmation = new PaydunyaClient.Confirmation(
                "tok_123", PaydunyaClient.StatutConfirmation.CONFIRME, BigDecimal.valueOf(15000));
        when(paydunyaClient.confirmer("tok_123")).thenReturn(confirmation);

        paiementService.traiterWebhook(webhook);

        var ordre = inOrder(paydunyaSignatureVerifier, paydunyaClient, paiementFinalisationService);
        ordre.verify(paydunyaSignatureVerifier).verifier(webhook);
        ordre.verify(paydunyaClient).confirmer("tok_123");
        ordre.verify(paiementFinalisationService).appliquer("tok_123", webhook, confirmation);
    }

    @Test
    void traiterWebhook_neContactePasPaydunya_siSignatureInvalide() {
        PaydunyaWebhook webhook = new PaydunyaWebhook("tok_123", "completed", "invalide");
        doThrow(new RequeteInvalideException("Signature webhook PayDunya invalide"))
                .when(paydunyaSignatureVerifier).verifier(webhook);

        assertThatThrownBy(() -> paiementService.traiterWebhook(webhook))
                .isInstanceOf(RequeteInvalideException.class);

        verifyNoInteractions(paydunyaClient, paiementFinalisationService);
    }

    @Test
    void initier_creePaiementEtRetourneUrlDuFournisseur() {
        Commande commande = commandeAvecLigne(10L, "client@example.com", CommandeStatut.EN_ATTENTE_PAIEMENT, BigDecimal.valueOf(30000));
        when(commandeRepository.findById(10L)).thenReturn(Optional.of(commande));
        when(paiementRepository.findByCommandeId(10L)).thenReturn(Optional.empty());
        when(paydunyaProperties.callbackUrl()).thenReturn("https://example.test/webhook");
        when(paydunyaClient.creerInvoice(eq(BigDecimal.valueOf(30000)), anyString(), eq("https://example.test/webhook")))
                .thenReturn(new PaydunyaClient.InvoiceCree("tok_new", "https://paydunya.test/invoice/tok_new"));

        PaiementResponse response = paiementService.initier(10L, "client@example.com");

        assertThat(response.urlPaiement()).isEqualTo("https://paydunya.test/invoice/tok_new");
        verify(paiementRepository).save(any(Paiement.class));
    }

    @Test
    void initier_reutiliseUrlPersistante_siInvoiceToujoursEnAttente() {
        Commande commande = commandeAvecLigne(10L, "client@example.com", CommandeStatut.EN_ATTENTE_PAIEMENT, BigDecimal.valueOf(30000));
        Paiement existant = Paiement.builder().id(1L).commande(commande).montant(BigDecimal.valueOf(30000))
                .tokenPaydunya("tok_exist").urlPaydunya("https://paydunya.test/invoice/tok_exist").build();
        when(commandeRepository.findById(10L)).thenReturn(Optional.of(commande));
        when(paiementRepository.findByCommandeId(10L)).thenReturn(Optional.of(existant));
        when(paydunyaClient.estEnAttente("tok_exist")).thenReturn(true);

        PaiementResponse response = paiementService.initier(10L, "client@example.com");

        assertThat(response.urlPaiement()).isEqualTo("https://paydunya.test/invoice/tok_exist");
        verify(paydunyaClient, never()).creerInvoice(any(), any(), any());
    }

    @Test
    void initier_refusePaiementPourCommandePayeeOuAnnulee() {
        Commande commande = commandeDe(10L, "client@example.com", CommandeStatut.PAYEE);
        when(commandeRepository.findById(10L)).thenReturn(Optional.of(commande));

        assertThatThrownBy(() -> paiementService.initier(10L, "client@example.com"))
                .isInstanceOf(RequeteInvalideException.class);
        commande.setStatut(CommandeStatut.ANNULEE);
        assertThatThrownBy(() -> paiementService.initier(10L, "client@example.com"))
                .isInstanceOf(RequeteInvalideException.class);
    }

    @Test
    void initier_cacheUneCommandeTiers() {
        when(commandeRepository.findById(10L)).thenReturn(Optional.of(commandeDe(10L, "autre@example.com", CommandeStatut.EN_ATTENTE_PAIEMENT)));
        assertThatThrownBy(() -> paiementService.initier(10L, "client@example.com"))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

    @Test
    void initier_conflitEcritureConcurrente_remontePaiementDejaInitie() {
        Commande commande = commandeAvecLigne(10L, "client@example.com", CommandeStatut.EN_ATTENTE_PAIEMENT, BigDecimal.valueOf(30000));
        when(commandeRepository.findById(10L)).thenReturn(Optional.of(commande));
        when(paiementRepository.findByCommandeId(10L)).thenReturn(Optional.empty());
        when(paydunyaProperties.callbackUrl()).thenReturn("https://example.test/webhook");
        when(paydunyaClient.creerInvoice(eq(BigDecimal.valueOf(30000)), anyString(), eq("https://example.test/webhook")))
                .thenReturn(new PaydunyaClient.InvoiceCree("tok_new", "https://paydunya.test/invoice/tok_new"));
        when(paiementRepository.save(any(Paiement.class)))
                .thenThrow(new DataIntegrityViolationException("contrainte unique paiement.commande_id"));

        assertThatThrownBy(() -> paiementService.initier(10L, "client@example.com"))
                .isInstanceOf(PaiementDejaInitieException.class);
    }

    @Test
    void superviser_signaleLesEcartsWebhook() {
        Paiement suspect = Paiement.builder().id(1L).commande(commandeDe(1L, "client@example.com", CommandeStatut.EN_ATTENTE_PAIEMENT))
                .montant(BigDecimal.TEN).statut(PaiementStatut.ECHOUE).statutAnnonceWebhook("completed").dateDernierWebhook(LocalDateTime.now()).build();
        when(paiementRepository.findAllByOrderByDateCreationDesc()).thenReturn(List.of(suspect));
        List<PaiementSuperviseResponse> resultats = paiementService.superviser();
        assertThat(resultats).singleElement().satisfies(paiement -> assertThat(paiement.ecartWebhook()).isTrue());
    }

    private Commande commandeDe(Long id, String email, CommandeStatut statut) {
        return Commande.builder().id(id).client(Utilisateur.builder().id(1L).email(email).build()).statut(statut).dateCreation(LocalDateTime.now()).build();
    }

    private Commande commandeAvecLigne(Long id, String email, CommandeStatut statut, BigDecimal montant) {
        Commande commande = commandeDe(id, email, statut);
        Produit produit = Produit.builder().id(1L).nom("Produit").prix(montant).build();
        commande.getLignes().add(LigneCommande.builder().commande(commande).produit(produit).quantite(1).prixUnitaire(montant).build());
        return commande;
    }
}
