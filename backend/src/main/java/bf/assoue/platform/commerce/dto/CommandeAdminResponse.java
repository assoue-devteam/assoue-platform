package bf.assoue.platform.commerce.dto;

import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Vue manager (MG-02) : contrairement à {@link CommandeResponse} destinée au
 * client, elle expose le client à l'origine de la commande.
 */
public record CommandeAdminResponse(
        Long id,
        String clientEmail,
        CommandeStatut statut,
        LocalDateTime dateCreation,
        BigDecimal total,
        List<LigneCommandeResponse> lignes
) {

    public static CommandeAdminResponse depuis(Commande commande) {
        CommandeResponse base = CommandeResponse.depuis(commande);
        return new CommandeAdminResponse(
                base.id(),
                commande.getClient().getEmail(),
                base.statut(),
                base.dateCreation(),
                base.total(),
                base.lignes()
        );
    }

}
