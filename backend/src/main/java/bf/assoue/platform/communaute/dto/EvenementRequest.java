package bf.assoue.platform.communaute.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record EvenementRequest(
        @NotBlank @Size(max = 150) String titre,
        @NotNull LocalDateTime dateDebut,
        @NotBlank @Size(max = 200) String lieu,
        @Size(max = 2000) String description,
        // http(s) seulement : l'URL finit dans un <img src>, pas de javascript: ni de data:.
        @Size(max = 500) @Pattern(regexp = "^https?://\\S+$", message = "L'image doit être une adresse http(s)") String imageUrl,
        @Min(0) Integer placesRestantes
) {
}
