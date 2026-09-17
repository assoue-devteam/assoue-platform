package bf.assoue.platform.paiement.dto;

import bf.assoue.platform.paiement.model.Paiement;
import bf.assoue.platform.paiement.model.PaiementStatut;

import java.math.BigDecimal;

public record PaiementResponse(Long commandeId, BigDecimal montant, PaiementStatut statut, String urlPaiement) {

    public static PaiementResponse depuis(Paiement paiement, String urlPaiement) {
        return new PaiementResponse(paiement.getCommande().getId(), paiement.getMontant(), paiement.getStatut(), urlPaiement);
    }

}
