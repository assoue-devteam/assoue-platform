package bf.assoue.platform.commerce.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Contenu complet du panier : remplace l'existant, une liste vide le vide. */
public record PanierRequest(
        @NotNull @Valid List<LigneCommandeRequest> lignes
) {
}
