package bf.assoue.platform.common.mail;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "assoue.mail")
public class MailProprietes {

    private String hote = "localhost";
    private int port = 25;
    private String protocol = "smtp";
    private String utilisateur;
    private String motDePasse;
    private String expediteur = "no-reply@assoue.bf";
    private List<String> alertesDestinataires = new ArrayList<>();
}
