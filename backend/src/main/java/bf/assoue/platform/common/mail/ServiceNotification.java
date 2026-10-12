package bf.assoue.platform.common.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServiceNotification {

    private static final int TENTATIVES_MAX = 3;

    private final CanalEnvoi canalEnvoi;
    private final MailProprietes mailProprietes;

    @Async("envoiNotificationsExecutor")
    public void envoyerAsynchrone(MessageEmail message) {
        for (int tentative = 1; tentative <= TENTATIVES_MAX; tentative++) {
            try {
                canalEnvoi.envoyer(message);
                return;
            } catch (Exception e) {
                log.error("Envoi email échec tentative {}/{} sujet '{}' destinataire '{}' : {}",
                        tentative, TENTATIVES_MAX, message.sujet(),
                        AdressesEmail.masquer(message.destinataire()), e.getMessage());
                if (tentative < TENTATIVES_MAX) {
                    try {
                        Thread.sleep(100L * tentative);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
            }
        }
        log.error("Envoi email abandonné après {} tentatives sujet '{}' destinataire '{}'",
                TENTATIVES_MAX, message.sujet(), AdressesEmail.masquer(message.destinataire()));
    }

    public void envoyerAlertesAsynchrone(String sujet, String contenuHtml, String contenuTexte) {
        if (mailProprietes.getAlertesDestinataires().isEmpty()) {
            log.info("Aucune adresse d'alerte configurée, alerte ignorée sujet '{}'", sujet);
            return;
        }
        for (String destinataire : mailProprietes.getAlertesDestinataires()) {
            envoyerAsynchrone(new MessageEmail(destinataire, sujet, contenuHtml, contenuTexte));
        }
    }
}
