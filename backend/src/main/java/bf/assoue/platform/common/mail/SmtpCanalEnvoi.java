package bf.assoue.platform.common.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Profile("!test")
@RequiredArgsConstructor
public class SmtpCanalEnvoi implements CanalEnvoi {

    private final JavaMailSender mailSender;
    private final MailProprietes proprietes;

    @Override
    public void envoyer(MessageEmail message) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(proprietes.getExpediteur());
            helper.setTo(message.destinataire());
            helper.setSubject(message.sujet());
            helper.setText(message.contenuTexte(), message.contenuHtml());
            mailSender.send(mime);
            log.info("Email envoyé sujet '{}' destinataire '{}'", message.sujet(), AdressesEmail.masquer(message.destinataire()));
        } catch (Exception e) {
            log.error("Échec envoi SMTP sujet '{}' destinataire '{}' : {}",
                    message.sujet(), AdressesEmail.masquer(message.destinataire()), e.getMessage());
            throw new EnvoiEmailException("Échec envoi SMTP", e);
        }
    }
}
