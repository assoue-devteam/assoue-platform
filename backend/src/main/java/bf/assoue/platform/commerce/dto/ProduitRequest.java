package bf.assoue.platform.commerce.dto;

import bf.assoue.platform.images.CleImage;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Création et modification d'un produit par l'admin (image par URL https existante
 * ou par upload via POST /api/images, même règle que les événements).
 * Prix entier en FCFA, jamais de float ;
 * 0 accepté (produit alors en rupture, comme un stock à 0).
 *
 * stockQuantite est une valeur absolue : à la création elle initialise le stock
 * (absente = 0, donc en rupture), à la modification elle le remplace (absente = inchangé).
 * Pas d'endpoint dédié : un seul appel suffit côté admin.
 *
 * Image (lot 8) : imageUrl (adresse https existante, affichée telle quelle) ou
 * imageCle (clé renvoyée par POST /api/images). Si les deux arrivent ensemble,
 * imageCle l'emporte et imageUrl est vidée.
 */
public record ProduitRequest(
        @NotBlank @Size(max = 200) String nom,
        @NotNull Long categorieId,
        @NotNull @Min(0) Integer prix,
        @Size(max = 2000) String description,
        // http(s) seulement : l'URL finit dans un <img src>, pas de javascript: ni de data:.
        @Size(max = 500) @Pattern(regexp = "^https?://\\S+$", message = "L'image doit être une adresse http(s)") String imageUrl,
        @Pattern(regexp = CleImage.REGEX_CHEMIN, message = "Référence d'image invalide") String imageCle,
        @Min(0) Integer stockQuantite,
        Boolean vedette
) {
}
