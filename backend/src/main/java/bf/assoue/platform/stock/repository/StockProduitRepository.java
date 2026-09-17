package bf.assoue.platform.stock.repository;

import bf.assoue.platform.stock.model.StockProduit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockProduitRepository extends JpaRepository<StockProduit, Long> {

    Optional<StockProduit> findByProduitId(Long produitId);

}
