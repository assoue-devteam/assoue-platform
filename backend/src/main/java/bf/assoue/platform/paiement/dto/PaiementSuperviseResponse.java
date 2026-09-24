package bf.assoue.platform.paiement.dto;

import bf.assoue.platform.commerce.model.CommandeStatut;
import bf.assoue.platform.paiement.model.Paiement;
import bf.assoue.platform.paiement.model.PaiementStatut;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Vue de supervision du super admin (SA-06). {@code statutAnnonceWebhook} est ce
 * que PayDunya a déclaré dans son appel, {@code statut} ce que la revalidation a
 * réellement constaté : un écart entre les deux est le signal d'une tentative de
 * fraude, la commande n'ayant jamais été validée sur la foi du webhook.
 */
public record PaiementSuperviseResponse(
        Long id,
        Long commandeId,
        String clientEmail,
        BigDecimal montant,
        PaiementStatut statut,
        CommandeStatut statutCommande,
        String tokenPaydunya,
        String statutAnnonceWebhook,
        LocalDateTime dateDernierWebhook,
        LocalDateTime dateCreation,
        LocalDateTime dateConfirmation,
        boolean ecartWebhook
) {

    public static PaiementSuperviseResponse depuis(Paiement paiement) {
        boolean ecartWebhook = paiement.getStatutAnnonceWebhook() != null
                && paiement.getStatut() != PaiementStatut.CONFIRME;

        return new PaiementSuperviseResponse(
                paiement.getId(),
                paiement.getCommande().getId(),
                paiement.getCommande().getClient().getEmail(),
                paiement.getMontant(),
                paiement.getStatut(),
                paiement.getCommande().getStatut(),
                paiement.getTokenPaydunya(),
                paiement.getStatutAnnonceWebhook(),
                paiement.getDateDernierWebhook(),
                paiement.getDateCreation(),
                paiement.getDateConfirmation(),
                ecartWebhook
        );
    }

}
