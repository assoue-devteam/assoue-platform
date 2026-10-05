package bf.assoue.platform.commerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Création et modification d'un produit par l'admin (option A : image par URL https,
 * même règle que les événements — pas d'upload). Prix entier en FCFA, jamais de float ;
 * 0 accepté (produit alors en rupture, comme un stock à 0).
 *
 * stockQuantite est une valeur absolue : à la création elle initialise le stock
 * (absente = 0, donc en rupture), à la modification elle le remplace (absente = inchangé).
 * Pas d'endpoint dédié : un seul appel suffit côté admin.
 */
public record ProduitRequest(
        @NotBlank @Size(max = 200) String nom,
        @NotNull Long categorieId,
        @NotNull @Min(0) Integer prix,
        @Size(max = 2000) String description,
        // http(s) seulement : l'URL finit dans un <img src>, pas de javascript: ni de data:.
        @Size(max = 500) @Pattern(regexp = "^https?://\\S+$", message = "L'image doit être une adresse http(s)") String imageUrl,
        @Min(0) Integer stockQuantite,
        Boolean vedette
) {
}
