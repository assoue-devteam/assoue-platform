package bf.assoue.platform.commerce.repository;

import bf.assoue.platform.commerce.model.Produit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProduitRepository extends JpaRepository<Produit, Long> {

    List<Produit> findByCategorieId(Long categorieId);

    /** Le catalogue public et la fiche produit ignorent les produits archivés. */
    @EntityGraph(attributePaths = "categorie")
    List<Produit> findByArchiveFalse();

    @EntityGraph(attributePaths = "categorie")
    List<Produit> findByCategorieIdAndArchiveFalse(Long categorieId);

    @EntityGraph(attributePaths = "categorie")
    Optional<Produit> findByIdAndArchiveFalse(Long id);

}
