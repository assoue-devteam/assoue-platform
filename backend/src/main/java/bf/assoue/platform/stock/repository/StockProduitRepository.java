package bf.assoue.platform.stock.repository;

import bf.assoue.platform.stock.model.StockProduit;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StockProduitRepository extends JpaRepository<StockProduit, Long> {

    Optional<StockProduit> findByProduitId(Long produitId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select stock from StockProduit stock where stock.produit.id = :produitId")
    Optional<StockProduit> findByProduitIdForUpdate(@Param("produitId") Long produitId);

}
