package bf.assoue.platform.communaute.dto;

import bf.assoue.platform.communaute.model.Evenement;
import bf.assoue.platform.images.ImageService;

import java.time.LocalDateTime;

public record EvenementResponse(
        Long id,
        String titre,
        LocalDateTime dateDebut,
        String lieu,
        String description,
        String imageUrl,
        /** Clé d'image uploadée (null si URL legacy ou sans image) : imageUrl reste le champ d'affichage. */
        String imageCle,
        Integer placesRestantes
) {

    public static EvenementResponse depuis(Evenement evenement) {
        return new EvenementResponse(evenement.getId(), evenement.getTitre(), evenement.getDateDebut(), evenement.getLieu(),
                evenement.getDescription(), resoudreImage(evenement), evenement.getImageCle(),
                evenement.getPlacesRestantes());
    }

    /** URL legacy telle quelle, sinon chemin d'image uploadée, sinon rien. */
    public static String resoudreImage(Evenement evenement) {
        if (evenement.getImageUrl() != null) {
            return evenement.getImageUrl();
        }
        if (evenement.getImageCle() != null) {
            return ImageService.CHEMIN_PUBLIC + evenement.getImageCle();
        }
        return null;
    }
}
