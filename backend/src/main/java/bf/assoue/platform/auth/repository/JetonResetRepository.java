package bf.assoue.platform.auth.repository;

import bf.assoue.platform.auth.model.JetonReset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JetonResetRepository extends JpaRepository<JetonReset, String> {

    Optional<JetonReset> findByJti(String jti);
}
