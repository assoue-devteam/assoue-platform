package bf.assoue.platform.common.mail;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceNotificationTest {

    @Mock
    private CanalEnvoi canalEnvoi;

    private MailProprietes mailProprietes;
    private ServiceNotification serviceNotification;

    @BeforeEach
    void setUp() {
        mailProprietes = new MailProprietes();
        serviceNotification = new ServiceNotification(canalEnvoi, mailProprietes);
    }

    @Test
    void envoyerAsynchrone_envoieQuandCanalOk() {
        MessageEmail message = new MessageEmail("a@exemple.com", "Sujet", "<p>html</p>", "texte");

        serviceNotification.envoyerAsynchrone(message);

        verify(canalEnvoi).envoyer(message);
    }

    @Test
    void envoyerAsynchrone_relance2FoisPuisAbandonneSurEchecCumul() {
        doThrow(new EnvoiEmailException("ko", new RuntimeException()))
                .when(canalEnvoi).envoyer(any());

        serviceNotification.envoyerAsynchrone(new MessageEmail("a@exemple.com", "S", "h", "t"));

        verify(canalEnvoi, times(3)).envoyer(any());
    }

    @Test
    void envoyerAsynchrone_sarreteDesQueLeCanalRepond() {
        doThrow(new EnvoiEmailException("ko", new RuntimeException()))
                .doNothing()
                .when(canalEnvoi).envoyer(any());

        serviceNotification.envoyerAsynchrone(new MessageEmail("a@exemple.com", "S", "h", "t"));

        verify(canalEnvoi, times(2)).envoyer(any());
    }

    @Test
    void envoyerAlertesAsynchrone_envoieAChaqueDestinataire() {
        mailProprietes.setAlertesDestinataires(List.of("a@assoue.bf", "b@assoue.bf"));

        serviceNotification.envoyerAlertesAsynchrone("Alerte", "<p>corps</p>", "corps");

        verify(canalEnvoi, times(2)).envoyer(any());
    }

    @Test
    void envoyerAlertesAsynchrone_nEnvoyePasQuandAucuneAdresse() {
        serviceNotification.envoyerAlertesAsynchrone("Alerte", "<p>corps</p>", "corps");

        verify(canalEnvoi, never()).envoyer(any());
    }
}
