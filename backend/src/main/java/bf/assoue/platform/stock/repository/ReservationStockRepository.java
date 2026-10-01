package bf.assoue.platform.stock.repository;

import bf.assoue.platform.stock.model.ReservationStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservationStockRepository extends JpaRepository<ReservationStock, Long> {

    List<ReservationStock> findByCommandeId(Long commandeId);

    long deleteByCommandeId(Long commandeId);
}
