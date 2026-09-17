package bf.assoue.platform.paiement.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "paydunya")
public record PaydunyaProperties(String mode, String masterKey, String privateKey, String token) {

    public String urlBase() {
        return "test".equals(mode)
                ? "https://app.paydunya.com/sandbox-api/v1"
                : "https://app.paydunya.com/api/v1";
    }

}
