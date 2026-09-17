package bf.assoue.platform.commerce.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CommandeRequest(
        @NotEmpty(message = "Une commande doit contenir au moins une ligne") @Valid List<LigneCommandeRequest> lignes
) {
}
