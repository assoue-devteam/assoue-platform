package bf.assoue.platform.collecte.repository;

import bf.assoue.platform.collecte.model.Compensation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompensationRepository extends JpaRepository<Compensation, Long> {
}
