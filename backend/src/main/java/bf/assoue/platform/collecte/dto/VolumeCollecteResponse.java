package bf.assoue.platform.collecte.dto;

import java.math.BigDecimal;

/**
 * Volume collecté agrégé par collecteur et par matériau (MG-04) — sert à évaluer
 * la performance du réseau terrain.
 */
public record VolumeCollecteResponse(
        Long collecteurId,
        String collecteurEmail,
        String materiau,
        BigDecimal quantiteTotale,
        long nombreDeclarations
) {
}
