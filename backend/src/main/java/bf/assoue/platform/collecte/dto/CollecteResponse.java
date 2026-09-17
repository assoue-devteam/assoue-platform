package bf.assoue.platform.collecte.dto;

import bf.assoue.platform.collecte.model.Collecte;
import bf.assoue.platform.collecte.model.CollecteStatut;
import bf.assoue.platform.collecte.model.LigneCollecte;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CollecteResponse(
        Long id,
        String referenceClient,
        CollecteStatut statut,
        LocalDateTime dateDeclaration,
        Double latitude,
        Double longitude,
        List<LigneResponse> lignes
) {

    public record LigneResponse(String materiau, BigDecimal quantiteEstimee) {
    }

    public static CollecteResponse depuis(Collecte collecte) {
        List<LigneResponse> lignes = collecte.getLignes().stream()
                .map(CollecteResponse::versLigneResponse)
                .toList();

        return new CollecteResponse(
                collecte.getId(),
                collecte.getReferenceClient(),
                collecte.getStatut(),
                collecte.getDateDeclaration(),
                collecte.getPointCollecte().getLatitude(),
                collecte.getPointCollecte().getLongitude(),
                lignes
        );
    }

    private static LigneResponse versLigneResponse(LigneCollecte ligne) {
        return new LigneResponse(ligne.getMateriau().getNom(), ligne.getQuantiteEstimee());
    }

}
