package bf.assoue.platform.commerce.dto;

import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CommandeResponse(
        Long id,
        CommandeStatut statut,
        LocalDateTime dateCreation,
        BigDecimal total,
        List<LigneCommandeResponse> lignes
) {

    public static CommandeResponse depuis(Commande commande) {
        List<LigneCommandeResponse> lignes = commande.getLignes().stream()
                .map(LigneCommandeResponse::depuis)
                .toList();

        BigDecimal total = commande.getLignes().stream()
                .map(ligne -> ligne.getPrixUnitaire().multiply(BigDecimal.valueOf(ligne.getQuantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CommandeResponse(commande.getId(), commande.getStatut(), commande.getDateCreation(), total, lignes);
    }

}
