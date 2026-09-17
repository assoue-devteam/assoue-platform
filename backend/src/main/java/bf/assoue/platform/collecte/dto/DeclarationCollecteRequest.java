package bf.assoue.platform.collecte.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * `referenceClient` est l'UUID généré côté frontend au moment de la saisie
 * (hors-ligne ou non) — sert de clé d'idempotence à la synchronisation (US-03).
 */
public record DeclarationCollecteRequest(
        @NotBlank String referenceClient,
        @NotNull Long materiauId,
        @NotNull @DecimalMin(value = "0.01", message = "La quantité estimée doit être positive") BigDecimal quantiteEstimee,
        @NotNull @Valid LocalisationRequest localisation
) {
}
