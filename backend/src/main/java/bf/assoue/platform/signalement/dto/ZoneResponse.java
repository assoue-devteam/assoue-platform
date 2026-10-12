package bf.assoue.platform.signalement.dto;

public record ZoneResponse(Long id, String nom, boolean actif) {
    public static ZoneResponse de(bf.assoue.platform.signalement.model.Zone zone) {
        return new ZoneResponse(zone.getId(), zone.getNom(), zone.isActif());
    }
}