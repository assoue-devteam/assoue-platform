package bf.assoue.platform.paiement.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;
import bf.assoue.platform.commerce.repository.CommandeRepository;
import bf.assoue.platform.commerce.service.CommandeService;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.paiement.dto.PaiementSuperviseResponse;
import bf.assoue.platform.paiement.model.Paiement;
import bf.assoue.platform.paiement.model.PaiementStatut;
import bf.assoue.platform.paiement.repository.PaiementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaiementServiceTest {

    @Mock
    private PaiementRepository paiementRepository;
    @Mock
    private CommandeRepository commandeRepository;
    @Mock
    private CommandeService commandeService;
    @Mock
    private PaydunyaClient paydunyaClient;

    @InjectMocks
    private PaiementService paiementService;

    @Test
    void traiterWebhook_rejettePaiementEtNeValidePasCommande_siRevalidationEchoueMalgreWebhookReussi() {
        // SA-06 DoD : Une commande n'est jamais validée sur la seule foi du contenu du webhook.
        // Scénario de divergence / tentative de fraude : le webhook prétend "completed",
        // mais paydunyaClient.estConfirme(token) renvoie false.
        String token = "tok_test_fraud_123";
        Commande commande = commandeDe(42L, "client@example.com", CommandeStatut.EN_ATTENTE_PAIEMENT);
        Paiement paiement = Paiement.builder()
                .id(1L)
                .commande(commande)
                .montant(BigDecimal.valueOf(15000))
                .statut(PaiementStatut.EN_ATTENTE)
                .tokenPaydunya(token)
                .dateCreation(LocalDateTime.now())
                .build();

        when(paiementRepository.findByTokenPaydunya(token)).thenReturn(Optional.of(paiement));
        when(paydunyaClient.estConfirme(token)).thenReturn(false);

        Map<String, Object> payload = Map.of(
                "token", token,
                "status", "completed"
        );

        paiementService.traiterWebhook(payload);

        // Vérifications
        assertThat(paiement.getStatut()).isEqualTo(PaiementStatut.ECHOUE);
        assertThat(paiement.getStatutAnnonceWebhook()).isEqualTo("completed");
        assertThat(paiement.getDateDernierWebhook()).isNotNull();
        assertThat(paiement.getDateConfirmation()).isNull();

        verify(paiementRepository).save(paiement);
        // La commande ne doit JAMAIS être marquée payée
        verify(commandeService, never()).marquerPayee(any());
    }

    @Test
    void traiterWebhook_validePaiementEtCommande_siRevalidationReussie() {
        String token = "tok_valid_456";
        Commande commande = commandeDe(50L, "client@example.com", CommandeStatut.EN_ATTENTE_PAIEMENT);
        Paiement paiement = Paiement.builder()
                .id(2L)
                .commande(commande)
                .montant(BigDecimal.valueOf(25000))
                .statut(PaiementStatut.EN_ATTENTE)
                .tokenPaydunya(token)
                .dateCreation(LocalDateTime.now())
                .build();

        when(paiementRepository.findByTokenPaydunya(token)).thenReturn(Optional.of(paiement));
        when(paydunyaClient.estConfirme(token)).thenReturn(true);

        Map<String, Object> payload = Map.of(
                "token", token,
                "status", "completed"
        );

        paiementService.traiterWebhook(payload);

        assertThat(paiement.getStatut()).isEqualTo(PaiementStatut.CONFIRME);
        assertThat(paiement.getStatutAnnonceWebhook()).isEqualTo("completed");
        assertThat(paiement.getDateDernierWebhook()).isNotNull();
        assertThat(paiement.getDateConfirmation()).isNotNull();

        verify(paiementRepository).save(paiement);
        verify(commandeService).marquerPayee(50L);
    }

    @Test
    void traiterWebhook_accepteTokenEtStatusDansChampData() {
        String token = "tok_data_789";
        Commande commande = commandeDe(60L, "client@example.com", CommandeStatut.EN_ATTENTE_PAIEMENT);
        Paiement paiement = Paiement.builder()
                .id(3L)
                .commande(commande)
                .montant(BigDecimal.valueOf(10000))
                .statut(PaiementStatut.EN_ATTENTE)
                .tokenPaydunya(token)
                .build();

        when(paiementRepository.findByTokenPaydunya(token)).thenReturn(Optional.of(paiement));
        when(paydunyaClient.estConfirme(token)).thenReturn(true);

        Map<String, Object> payload = Map.of(
                "data", Map.of(
                        "token", token,
                        "status", "completed"
                )
        );

        paiementService.traiterWebhook(payload);

        assertThat(paiement.getStatut()).isEqualTo(PaiementStatut.CONFIRME);
        assertThat(paiement.getStatutAnnonceWebhook()).isEqualTo("completed");
        verify(commandeService).marquerPayee(60L);
    }

    @Test
    void traiterWebhook_leveExceptionSiTokenAbsent() {
        Map<String, Object> payload = Map.of("status", "completed");

        assertThatThrownBy(() -> paiementService.traiterWebhook(payload))
                .isInstanceOf(RequeteInvalideException.class);

        verifyNoInteractions(paiementRepository, paydunyaClient, commandeService);
    }

    @Test
    void superviser_signaleEcartSiWebhookRecuMaisPaiementNonConfirme() {
        Commande commande1 = commandeDe(1L, "client1@example.com", CommandeStatut.EN_ATTENTE_PAIEMENT);
        Paiement pSuspect = Paiement.builder()
                .id(1L)
                .commande(commande1)
                .montant(BigDecimal.valueOf(15000))
                .statut(PaiementStatut.ECHOUE)
                .tokenPaydunya("tok_1")
                .statutAnnonceWebhook("completed")
                .dateDernierWebhook(LocalDateTime.now())
                .dateCreation(LocalDateTime.now())
                .build();

        Commande commande2 = commandeDe(2L, "client2@example.com", CommandeStatut.PAYEE);
        Paiement pNormal = Paiement.builder()
                .id(2L)
                .commande(commande2)
                .montant(BigDecimal.valueOf(20000))
                .statut(PaiementStatut.CONFIRME)
                .tokenPaydunya("tok_2")
                .statutAnnonceWebhook("completed")
                .dateDernierWebhook(LocalDateTime.now())
                .dateCreation(LocalDateTime.now())
                .dateConfirmation(LocalDateTime.now())
                .build();

        when(paiementRepository.findAllByOrderByDateCreationDesc()).thenReturn(List.of(pSuspect, pNormal));

        List<PaiementSuperviseResponse> supervision = paiementService.superviser();

        assertThat(supervision).hasSize(2);
        assertThat(supervision.get(0).ecartWebhook()).isTrue();
        assertThat(supervision.get(0).statut()).isEqualTo(PaiementStatut.ECHOUE);
        assertThat(supervision.get(0).statutAnnonceWebhook()).isEqualTo("completed");

        assertThat(supervision.get(1).ecartWebhook()).isFalse();
        assertThat(supervision.get(1).statut()).isEqualTo(PaiementStatut.CONFIRME);
    }

    private Commande commandeDe(Long id, String emailClient, CommandeStatut statut) {
        return Commande.builder()
                .id(id)
                .client(Utilisateur.builder().id(100L).email(emailClient).build())
                .statut(statut)
                .dateCreation(LocalDateTime.now())
                .build();
    }

}
