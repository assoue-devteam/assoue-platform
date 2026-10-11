package bf.assoue.platform.common.notification;

import bf.assoue.platform.common.mail.ModelesEmail;
import bf.assoue.platform.common.mail.MessageEmail;
import bf.assoue.platform.common.mail.ServiceNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final NotificationRepository notificationRepository;
    private final ServiceNotification serviceNotification;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void surCollecteDeclaree(CollecteDeclareeEvent event) {
        enregistrer("COLLECTE", event.collecteId(), "ADMIN");
        envoyerAlerte("Nouvelle collecte déclarée",
                "Une collecte a été déclarée dans la zone " + event.zone() + " le " + event.date() + ".",
                "Zone : " + event.zone() + "\nDate : " + event.date());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void surSignaleCree(SignaleCreeEvent event) {
        enregistrer("SIGNALEMENT", event.signalementId(), "ADMIN");
        envoyerAlerte("Nouveau signalement de pneu",
                "Un signalement a été déclaré dans la zone " + event.zone() + " le " + event.date() + ".",
                "Zone : " + event.zone() + "\nDate : " + event.date());
    }

    private void enregistrer(String type, Long typeId, String destinataire) {
        try {
            notificationRepository.save(Notification.builder()
                    .type(type)
                    .typeId(typeId)
                    .destinataire(destinataire)
                    .lue(false)
                    .build());
        } catch (DataIntegrityViolationException e) {
            log.info("Notification déjà existante pour type={} id={}, ignorée", type, typeId);
        }
    }

    private void envoyerAlerte(String sujet, String corpsHtml, String corpsTexte) {
        try {
            serviceNotification.envoyerAlertesAsynchrone(sujet,
                    ModelesEmail.html(sujet, "<p>" + corpsHtml + "</p>"),
                    ModelesEmail.texte(sujet, corpsTexte));
        } catch (Exception e) {
            log.error("Échec envoi alerte {} : {}", sujet, e.getMessage());
        }
    }
}
