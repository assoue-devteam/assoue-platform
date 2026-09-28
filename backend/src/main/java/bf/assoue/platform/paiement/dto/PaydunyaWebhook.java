package bf.assoue.platform.paiement.dto;

public record PaydunyaWebhook(String token, String status, String hash) {
}
