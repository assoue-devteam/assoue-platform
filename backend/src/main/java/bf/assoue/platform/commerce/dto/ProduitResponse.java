package bf.assoue.platform.commerce.dto;

import java.math.BigDecimal;

public record ProduitResponse(
        Long id,
        String nom,
        String description,
        BigDecimal prix,
        String imageUrl,
        String categorie,
        boolean enRupture
) {
}
