package bf.assoue.platform.auth.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "assoue.motdepasse")
public class MotDePasseOublieProperties {

    private String cleHmac = "cle-hmac-dev-a-remplacer-en-production";
    private int codeDureeMin = 10;
    private int codeEssaisMax = 5;
    private int jetonDureeMin = 5;
    private int delaiEntreEnvoisSecondes = 300;
    private int plafondParHeure = 3;
    private int rateLimitIpMax = 5;
    private int rateLimitIpFenetreSecondes = 60;
}
