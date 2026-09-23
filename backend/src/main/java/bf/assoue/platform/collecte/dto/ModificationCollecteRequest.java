package bf.assoue.platform.collecte.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Correction d'une saisie terrain (COL-03) — la référence client n'est pas
 * modifiable, elle reste la clé d'idempotence de la synchronisation.
 */
public record ModificationCollecteRequest(
        @NotNull Long materiauId,
        @NotNull @DecimalMin(value = "0.01", message = "La quantité estimée doit être positive") BigDecimal quantiteEstimee,
        @NotNull @Valid LocalisationRequest localisation
) {
}
