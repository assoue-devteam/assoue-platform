package bf.assoue.platform.signalement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreerSignalementRequest(
        @NotNull Long zoneId,
        @NotBlank @Size(max = 500) String description,
        Double latitude,
        Double longitude
) {
}