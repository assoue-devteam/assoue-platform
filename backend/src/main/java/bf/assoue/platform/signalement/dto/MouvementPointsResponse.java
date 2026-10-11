package bf.assoue.platform.signalement.dto;

import bf.assoue.platform.signalement.model.MouvementPoints;
import java.time.LocalDateTime;

public record MouvementPointsResponse(
        Long id,
        String type,
        int points,
        Long typeId,
        int soldeApres,
        LocalDateTime dateCreation
) {
    public static MouvementPointsResponse de(MouvementPoints m) {
        return new MouvementPointsResponse(
                m.getId(),
                m.getType(),
                m.getPoints(),
                m.getTypeId(),
                m.getSoldeApres(),
                m.getDateCreation()
        );
    }
}
