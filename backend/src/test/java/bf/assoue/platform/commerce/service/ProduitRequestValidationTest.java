package bf.assoue.platform.commerce.service;

import bf.assoue.platform.commerce.dto.ProduitRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Les 400 du POST/PUT /api/produits viennent de ces contraintes (via le
 * GlobalExceptionHandler déjà en place) : prix négatif, nom vide, image non
 * http(s), catégorie absente. Pas de MockMvc dans ce module : on valide le
 * record directement avec le moteur Bean Validation du classpath.
 */
class ProduitRequestValidationTest {

    private final Validator validateur = Validation.buildDefaultValidatorFactory().getValidator();

    private ProduitRequest valide() {
        return new ProduitRequest("Tabouret", 1L, 12000, "Tabouret en pneu",
                "https://cdn.example.com/tabouret.jpg", null, 5, false);
    }

    @Test
    void requeteValide_sansViolation() {
        assertThat(validateur.validate(valide())).isEmpty();
        assertThat(validateur.validate(new ProduitRequest("Offert", 1L, 0, null, null, null, null, null))).isEmpty();
    }

    @Test
    void nomVideEtPrixNegatif_sontRefuses() {
        Set<ConstraintViolation<ProduitRequest>> violations = validateur.validate(new ProduitRequest(
                "  ", 1L, -500, null, null, null, null, null));

        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .containsExactlyInAnyOrder("nom", "prix");
    }

    @Test
    void imageNonHttpsEtCategorieAbsente_sontRefusees() {
        Set<ConstraintViolation<ProduitRequest>> violations = validateur.validate(new ProduitRequest(
                "Tabouret", null, 12000, null, "javascript:alert(1)", null, null, null));

        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .containsExactlyInAnyOrder("categorieId", "imageUrl");
    }

    @Test
    void stockNegatif_estRefuse() {
        Set<ConstraintViolation<ProduitRequest>> violations = validateur.validate(new ProduitRequest(
                "Tabouret", 1L, 12000, null, null, null, -3, null));

        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .containsExactly("stockQuantite");
    }

    @Test
    void imageCleValide_passeEtCleMalformee_estRefusee() {
        assertThat(validateur.validate(new ProduitRequest(
                "Tabouret", 1L, 12000, null, null, "11111111-2222-3333-4444-555555555555.jpg", null, null)))
                .isEmpty();

        Set<ConstraintViolation<ProduitRequest>> violations = validateur.validate(new ProduitRequest(
                "Tabouret", 1L, 12000, null, null, "../pirate.jpg", null, null));

        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .containsExactly("imageCle");
    }

}
