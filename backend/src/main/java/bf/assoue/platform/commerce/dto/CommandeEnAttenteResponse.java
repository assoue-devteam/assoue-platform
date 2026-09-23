package bf.assoue.platform.commerce.dto;

import bf.assoue.platform.commerce.model.Commande;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Commande restée en attente de paiement (MG-05) — la relance client se fait
 * hors application, l'infra de notification temps réel (US-04) n'existe pas.
 */
public record CommandeEnAttenteResponse(
        Long id,
        String clientEmail,
        LocalDateTime dateCreation,
        long heuresDAttente,
        BigDecimal total
) {

    public static CommandeEnAttenteResponse depuis(Commande commande, LocalDateTime maintenant) {
        long heures = Duration.between(commande.getDateCreation(), maintenant).toHours();
        return new CommandeEnAttenteResponse(
                commande.getId(),
                commande.getClient().getEmail(),
                commande.getDateCreation(),
                heures,
                CommandeResponse.depuis(commande).total()
        );
    }

}
