package bf.assoue.platform.communaute.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Liste complète des chiffres, dans l'ordre d'affichage : remplace l'existante. */
public record ChiffresRequest(
        @NotNull @Size(max = 6, message = "6 chiffres au plus") @Valid List<Chiffre> chiffres
) {

    public record Chiffre(@NotBlank @Size(max = 80) String libelle, @Min(0) int valeur) {
    }

}
