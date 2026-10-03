package bf.assoue.platform.communaute.dto;

import bf.assoue.platform.communaute.model.Evenement;

import java.time.LocalDateTime;

public record EvenementResponse(
        Long id,
        String titre,
        LocalDateTime dateDebut,
        String lieu,
        String description,
        String imageUrl,
        Integer placesRestantes
) {

    public static EvenementResponse depuis(Evenement evenement) {
        return new EvenementResponse(evenement.getId(), evenement.getTitre(), evenement.getDateDebut(), evenement.getLieu(),
                evenement.getDescription(), evenement.getImageUrl(), evenement.getPlacesRestantes());
    }

}
