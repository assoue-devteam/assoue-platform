package bf.assoue.platform.paiement.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import bf.assoue.platform.common.exception.FournisseurPaiementIndisponibleException;

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

    public enum StatutConfirmation { EN_ATTENTE, CONFIRME, ECHOUE }

    public record Confirmation(String token, StatutConfirmation statut, BigDecimal montant) {
    }

    public String urlPaiement(String token) {
        return "https://paydunya.com/checkout/invoice/" + token;
    }

    public InvoiceCree creerInvoice(BigDecimal montant, String description, String callbackUrl) {
        if (callbackUrl == null || callbackUrl.isBlank() || proprietes.storeName() == null || proprietes.storeName().isBlank()) {
            throw new IllegalStateException("La configuration PayDunya requiert une URL de callback publique et le nom de boutique");
        }
        Map<String, Object> actions = new LinkedHashMap<>();
        actions.put("callback_url", callbackUrl);
        ajouterSiRenseigne(actions, "return_url", proprietes.returnUrl());
        ajouterSiRenseigne(actions, "cancel_url", proprietes.cancelUrl());
        Map<String, Object> corps = Map.of(
                "invoice", Map.of("total_amount", montant, "description", description),
                "store", Map.of("name", proprietes.storeName()),
                "actions", actions);
        try {
            Map<?, ?> reponse = restClient.post().uri(proprietes.urlBase() + "/checkout-invoice/create")
                    .headers(this::ajouterEntetesAuth).body(corps).retrieve().body(Map.class);
            if (reponse == null || !"00".equals(String.valueOf(reponse.get("response_code")))) {
                throw new IllegalStateException("Création d'invoice PayDunya refusée");
            }
            String token = String.valueOf(reponse.get("token"));
            String url = String.valueOf(reponse.get("response_text"));
            if (token.isBlank() || "null".equals(token) || url.isBlank() || "null".equals(url)) {
                throw new IllegalStateException("Réponse PayDunya incomplète lors de la création de l'invoice");
            }
            return new InvoiceCree(token, url);
        } catch (RestClientException ex) {
            throw new FournisseurPaiementIndisponibleException("PayDunya est momentanément indisponible", ex);
        }
    }

    public Confirmation confirmer(String token) {
        try {
            Map<?, ?> reponse = restClient.get().uri(proprietes.urlBase() + "/checkout-invoice/confirm/" + token)
                    .headers(this::ajouterEntetesAuth).retrieve().body(Map.class);
            if (reponse == null) {
                throw new FournisseurPaiementIndisponibleException("PayDunya a renvoyé une confirmation vide", null);
            }
            String statut = String.valueOf(reponse.get("status"));
            StatutConfirmation statutConfirmation = switch (statut) {
                case "completed" -> StatutConfirmation.CONFIRME;
                case "pending" -> StatutConfirmation.EN_ATTENTE;
                default -> StatutConfirmation.ECHOUE;
            };
            BigDecimal montant = reponse.get("total_amount") == null ? null : new BigDecimal(reponse.get("total_amount").toString());
            String tokenConfirme = reponse.get("token") == null ? token : reponse.get("token").toString();
            return new Confirmation(tokenConfirme, statutConfirmation, montant);
        } catch (RestClientException ex) {
            throw new FournisseurPaiementIndisponibleException("PayDunya est momentanément indisponible", ex);
        }
    }

    /**
     * Vérifie si une invoice PayDunya est encore en attente de paiement (utilisable).
     * Renvoie {@code false} si l'invoice est expirée, annulée ou introuvable —
     * auquel cas il faudra en recréer une nouvelle.
     */
    public boolean estEnAttente(String token) {
        return confirmer(token).statut() == StatutConfirmation.EN_ATTENTE;
    }

    private void ajouterEntetesAuth(org.springframework.http.HttpHeaders headers) {
        headers.set("PAYDUNYA-MASTER-KEY", proprietes.masterKey());
        headers.set("PAYDUNYA-PRIVATE-KEY", proprietes.privateKey());
        headers.set("PAYDUNYA-TOKEN", proprietes.token());
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
    }

    private void ajouterSiRenseigne(Map<String, Object> cible, String cle, String valeur) {
        if (valeur != null && !valeur.isBlank()) {
            cible.put(cle, valeur);
        }
    }

}
