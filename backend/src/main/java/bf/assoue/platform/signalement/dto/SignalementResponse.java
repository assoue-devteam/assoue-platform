package bf.assoue.platform.signalement.dto;

import bf.assoue.platform.signalement.model.Signalement;
import java.time.LocalDateTime;
import java.util.List;

public record SignalementResponse(
        Long id,
        Long zoneId,
        String zoneNom,
        String description,
        Double latitude,
        Double longitude,
        String statut,
        String motifRejet,
        LocalDateTime dateCreation,
        LocalDateTime dateValidation,
        List<PhotoSignalementResponse> photos
) {
    public static SignalementResponse de(Signalement s) {
        List<PhotoSignalementResponse> photos = s.getPhotos() != null ? s.getPhotos().stream()
                .map(PhotoSignalementResponse::de).toList() : List.of();
        return new SignalementResponse(
                s.getId(), s.getZone().getId(), s.getZone().getNom(),
                s.getDescription(), s.getLatitude(), s.getLongitude(),
                s.getStatut(), s.getMotifRejet(), s.getDateCreation(), s.getDateValidation(), photos);
    }
}