package bf.assoue.platform.common.mail;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
@EnableConfigurationProperties(MailProprietes.class)
public class MailConfig {

    @Bean
    public JavaMailSender javaMailSender(MailProprietes props) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(props.getHote());
        sender.setPort(props.getPort());
        sender.setProtocol(props.getProtocol());
        boolean avecAuth = props.getUtilisateur() != null && !props.getUtilisateur().isBlank();
        if (avecAuth) {
            sender.setUsername(props.getUtilisateur());
        }
        if (props.getMotDePasse() != null && !props.getMotDePasse().isBlank()) {
            sender.setPassword(props.getMotDePasse());
        }
        Properties javaMailProperties = new Properties();
        javaMailProperties.put("mail.smtp.auth", avecAuth);
        javaMailProperties.put("mail.smtp.starttls.enable", "true");
        javaMailProperties.put("mail.smtp.starttls.required", "true");
        // Brevo / Sendinblue exige la confiance explicite de son certificat
        javaMailProperties.put("mail.smtp.ssl.trust", props.getHote());
        sender.setJavaMailProperties(javaMailProperties);
        return sender;
    }
}
