package bf.assoue.platform.commerce.repository;

import bf.assoue.platform.commerce.model.Avis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AvisRepository extends JpaRepository<Avis, Long> {

    List<Avis> findByProduitIdOrderByDateCreationDesc(Long produitId);

    Optional<Avis> findByClientEmailAndProduitId(String email, Long produitId);

    @Query("select avg(a.note) from Avis a where a.produit.id = :produitId")
    Double noteMoyenne(@Param("produitId") Long produitId);

    long countByProduitId(Long produitId);

    /** Moyenne et nombre d'avis par produit, en une seule requête pour les listes. */
    @Query("select a.produit.id as produitId, avg(a.note) as moyenne, count(a) as nombre"
            + " from Avis a where a.produit.id in :ids group by a.produit.id")
    List<AvisStat> statsParProduit(@Param("ids") Collection<Long> ids);

    interface AvisStat {
        Long getProduitId();

        Double getMoyenne();

        Long getNombre();
    }

}
