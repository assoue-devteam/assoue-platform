package bf.assoue.platform.common.notification;

import bf.assoue.platform.common.mail.ServiceNotification;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationListenerTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ServiceNotification serviceNotification;

    @InjectMocks
    private NotificationListener listener;

    @Test
    void surCollecteDeclaree_enregistreNotificationEtEnvoieAlerte() {
        CollecteDeclareeEvent event = new CollecteDeclareeEvent(1L, "12.37,-1.52", LocalDateTime.now());

        listener.surCollecteDeclaree(event);

        verify(notificationRepository).save(argThat(n ->
                "COLLECTE".equals(n.getType()) && n.getTypeId() == 1L && "ADMIN".equals(n.getDestinataire())));
        verify(serviceNotification).envoyerAlertesAsynchrone(anyString(), anyString(), anyString());
    }

    @Test
    void surCollecteDeclaree_ignoreDoublon() {
        CollecteDeclareeEvent event = new CollecteDeclareeEvent(1L, "12.37,-1.52", LocalDateTime.now());
        doThrow(new org.springframework.dao.DataIntegrityViolationException("doublon"))
                .when(notificationRepository).save(any());

        listener.surCollecteDeclaree(event);

        verify(notificationRepository).save(any());
    }

    @Test
    void surSignaleCree_enregistreNotificationEtEnvoieAlerte() {
        SignaleCreeEvent event = new SignaleCreeEvent(2L, "Pissy", LocalDateTime.now());

        listener.surSignaleCree(event);

        verify(notificationRepository).save(argThat(n ->
                "SIGNALEMENT".equals(n.getType()) && n.getTypeId() == 2L && "ADMIN".equals(n.getDestinataire())));
        verify(serviceNotification).envoyerAlertesAsynchrone(anyString(), anyString(), anyString());
    }

    @Test
    void echecEnvoiEmail_neCassePasLaNotification() {
        CollecteDeclareeEvent event = new CollecteDeclareeEvent(1L, "12.37,-1.52", LocalDateTime.now());
        doThrow(new RuntimeException("SMTP down"))
                .when(serviceNotification).envoyerAlertesAsynchrone(anyString(), anyString(), anyString());

        listener.surCollecteDeclaree(event);

        verify(notificationRepository).save(any());
    }
}
