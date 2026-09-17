package bf.assoue.platform.stock.repository;

import bf.assoue.platform.stock.model.StockMatierePremiere;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockMatierePremiereRepository extends JpaRepository<StockMatierePremiere, Long> {

    Optional<StockMatierePremiere> findByMateriauId(Long materiauId);

}
