package bf.assoue.platform.collecte.dto;

import bf.assoue.platform.collecte.model.Collecte;
import bf.assoue.platform.collecte.model.CollecteStatut;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Vue manager (MG-04) : contrairement à {@link CollecteResponse} destinée au
 * collecteur, elle expose le collecteur à l'origine de la déclaration.
 */
public record CollecteAdminResponse(
        Long id,
        Long collecteurId,
        String collecteurEmail,
        CollecteStatut statut,
        LocalDateTime dateDeclaration,
        Double latitude,
        Double longitude,
        List<CollecteResponse.LigneResponse> lignes
) {

    public static CollecteAdminResponse depuis(Collecte collecte) {
        CollecteResponse base = CollecteResponse.depuis(collecte);
        return new CollecteAdminResponse(
                base.id(),
                collecte.getCollecteur().getId(),
                collecte.getCollecteur().getEmail(),
                base.statut(),
                base.dateDeclaration(),
                base.latitude(),
                base.longitude(),
                base.lignes()
        );
    }

}
