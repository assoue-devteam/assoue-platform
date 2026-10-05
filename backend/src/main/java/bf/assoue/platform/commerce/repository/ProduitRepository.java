package bf.assoue.platform.commerce.repository;

import bf.assoue.platform.commerce.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProduitRepository extends JpaRepository<Produit, Long> {

    List<Produit> findByCategorieId(Long categorieId);

    /** Le catalogue public et la fiche produit ignorent les produits archivés. */
    List<Produit> findByArchiveFalse();

    List<Produit> findByCategorieIdAndArchiveFalse(Long categorieId);

    Optional<Produit> findByIdAndArchiveFalse(Long id);

}
