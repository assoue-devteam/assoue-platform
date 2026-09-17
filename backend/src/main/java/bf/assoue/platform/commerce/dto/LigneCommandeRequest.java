package bf.assoue.platform.commerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record LigneCommandeRequest(
        @NotNull Long produitId,
        @Min(1) int quantite
) {
}
