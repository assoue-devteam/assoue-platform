package bf.assoue.platform.signalement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ValiderSignalementRequest(
        @NotBlank @Size(max = 500) String motifRejet
) {
}