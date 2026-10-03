package bf.assoue.platform.commerce.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AvisRequest(
        @NotNull @Min(1) @Max(5) Integer note,
        @Size(max = 1000, message = "Le commentaire ne doit pas dépasser 1000 caractères") String commentaire
) {
}
