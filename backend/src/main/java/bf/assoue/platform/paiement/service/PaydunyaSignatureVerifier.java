package bf.assoue.platform.paiement.service;

import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.paiement.dto.PaydunyaWebhook;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
@RequiredArgsConstructor
public class PaydunyaSignatureVerifier {

    private final PaydunyaProperties properties;

    public void verifier(PaydunyaWebhook webhook) {
        if (webhook.hash() == null || webhook.hash().isBlank()) {
            throw new RequeteInvalideException("Webhook PayDunya sans signature");
        }
        byte[] attendu = sha512(properties.masterKey()).getBytes(StandardCharsets.US_ASCII);
        byte[] recu = webhook.hash().trim().toLowerCase().getBytes(StandardCharsets.US_ASCII);
        if (!MessageDigest.isEqual(attendu, recu)) {
            throw new RequeteInvalideException("Signature webhook PayDunya invalide");
        }
    }

    private String sha512(String valeur) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-512")
                    .digest(valeur.getBytes(StandardCharsets.UTF_8));
            StringBuilder resultat = new StringBuilder(digest.length * 2);
            for (byte octet : digest) {
                resultat.append(String.format("%02x", octet));
            }
            return resultat.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-512 indisponible", ex);
        }
    }
}
