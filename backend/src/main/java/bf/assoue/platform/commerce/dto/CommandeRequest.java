package bf.assoue.platform.commerce.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Min;

import java.util.List;

public record CommandeRequest(
        @NotEmpty(message = "Une commande doit contenir au moins une ligne") @Valid List<LigneCommandeRequest> lignes,
        @Min(value = 0, message = "Les points doivent être positifs ou zéro") Integer pointsAUtiliser
) {
    public CommandeRequest(List<LigneCommandeRequest> lignes) {
        this(lignes, null);
    }
}
