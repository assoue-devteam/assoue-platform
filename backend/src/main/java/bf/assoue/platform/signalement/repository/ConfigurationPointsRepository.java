package bf.assoue.platform.signalement.repository;

import bf.assoue.platform.signalement.model.ConfigurationPoints;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfigurationPointsRepository extends JpaRepository<ConfigurationPoints, String> {

    Optional<ConfigurationPoints> findByCle(String cle);
}