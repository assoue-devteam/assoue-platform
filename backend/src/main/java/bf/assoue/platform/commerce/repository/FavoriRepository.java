package bf.assoue.platform.commerce.repository;

import bf.assoue.platform.commerce.model.Favori;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FavoriRepository extends JpaRepository<Favori, Long> {

    @EntityGraph(attributePaths = {"produit", "produit.categorie"})
    List<Favori> findByClientEmailOrderByDateAjoutDesc(String email);

    boolean existsByClientIdAndProduitId(Long clientId, Long produitId);

    void deleteByClientEmailAndProduitId(String email, Long produitId);

}
