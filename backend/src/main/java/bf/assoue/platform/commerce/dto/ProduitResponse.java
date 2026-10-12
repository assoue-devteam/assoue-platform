package bf.assoue.platform.commerce.dto;

import java.math.BigDecimal;

public record ProduitResponse(
        Long id,
        String nom,
        String description,
        BigDecimal prix,
        String imageUrl,
        /** Clé d'image uploadée (null si URL legacy ou sans image) : imageUrl reste le champ d'affichage. */
        String imageCle,
        String categorie,
        boolean enRupture,
        boolean vedette,
        Double noteMoyenne,
        long nombreAvis
) {
}
