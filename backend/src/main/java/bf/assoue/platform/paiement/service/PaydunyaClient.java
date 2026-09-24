package bf.assoue.platform.paiement.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Client minimal pour l'API "Checkout Invoice" de PayDunya (agrégateur Orange
 * Money/Moov retenu pour le projet, voir CLAUDE.md).
 *
 * ATTENTION — à vérifier avant mise en prod : la forme exacte des requêtes/réponses
 * ci-dessous est reconstituée à partir de la documentation publique de l'API
 * PayDunya "Checkout Invoice" (create / confirm), pas testée contre un vrai compte
 * marchand. Avant le premier paiement réel, comparer avec la doc officielle
 * (https://developers.paydunya.com) et le compte sandbox de l'équipe.
 */
@Component
@RequiredArgsConstructor
public class PaydunyaClient {

    private final PaydunyaProperties proprietes;
    private final RestClient restClient = RestClient.create();

    public record InvoiceCree(String token, String urlPaiement) {
    }

    public String urlPaiement(String token) {
        return "https://paydunya.com/checkout/invoice/" + token;
    }

    public InvoiceCree creerInvoice(BigDecimal montant, String description, String callbackUrl) {
        Map<String, Object> corps = Map.of(
                "invoice", Map.of(
                        "total_amount", montant,
                        "description", description
                ),
                "actions", Map.of(
                        "callback_url", callbackUrl
                )
        );

        Map<?, ?> reponse = restClient.post()
                .uri(proprietes.urlBase() + "/checkout-invoice/create")
                .headers(this::ajouterEntetesAuth)
                .body(corps)
                .retrieve()
                .body(Map.class);

        if (reponse == null) {
            throw new IllegalStateException("Réponse null de PayDunya lors de la création de l'invoice");
        }
        String token = (String) reponse.get("token");
        return new InvoiceCree(token, urlPaiement(token));
    }

    public boolean estConfirme(String token) {
        Map<?, ?> reponse = restClient.get()
                .uri(proprietes.urlBase() + "/checkout-invoice/confirm/" + token)
                .headers(this::ajouterEntetesAuth)
                .retrieve()
                .body(Map.class);

        if (reponse == null) {
            return false;
        }
        return "completed".equals(reponse.get("status"));
    }

    /**
     * Vérifie si une invoice PayDunya est encore en attente de paiement (utilisable).
     * Renvoie {@code false} si l'invoice est expirée, annulée ou introuvable —
     * auquel cas il faudra en recréer une nouvelle.
     */
    public boolean estEnAttente(String token) {
        try {
            Map<?, ?> reponse = restClient.get()
                    .uri(proprietes.urlBase() + "/checkout-invoice/confirm/" + token)
                    .headers(this::ajouterEntetesAuth)
                    .retrieve()
                    .body(Map.class);

            if (reponse == null) {
                return false;
            }
            String statut = reponse.get("status") instanceof String s ? s : null;
            // PayDunya renvoie "pending" tant que l'invoice est ouverte et payable
            return "pending".equals(statut);
        } catch (Exception e) {
            // Invoice inconnue / réseau HS → on considère le token mort
            return false;
        }
    }

    private void ajouterEntetesAuth(org.springframework.http.HttpHeaders headers) {
        headers.set("PAYDUNYA-MASTER-KEY", proprietes.masterKey());
        headers.set("PAYDUNYA-PRIVATE-KEY", proprietes.privateKey());
        headers.set("PAYDUNYA-TOKEN", proprietes.token());
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
    }

}
