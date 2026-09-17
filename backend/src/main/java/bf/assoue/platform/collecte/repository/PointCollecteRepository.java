package bf.assoue.platform.collecte.repository;

import bf.assoue.platform.collecte.model.PointCollecte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PointCollecteRepository extends JpaRepository<PointCollecte, Long> {

    Optional<PointCollecte> findByLatitudeAndLongitude(Double latitude, Double longitude);

}
