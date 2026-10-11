package bf.assoue.platform.signalement.dto;

public record SoldePointsResponse(int solde) {
}

public record MouvementPointsResponse(
        Long id,
        String type,
        int points,
        Long typeId,
        int soldeApres,
        java.time.LocalDateTime dateCreation
) {
    public static MouvementPointsResponse de(bf.assoue.platform.signalement.model.MouvementPoints m) {
        return new MouvementPointsResponse(m.getId(), m.getType(), m.getPoints(), m.getTypeId(), m.getSoldeApres(), m.getDateCreation());
    }
}