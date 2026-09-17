package bf.assoue.platform.collecte.dto;

import jakarta.validation.constraints.NotNull;

public record LocalisationRequest(
        @NotNull Double lat,
        @NotNull Double lng
) {
}
