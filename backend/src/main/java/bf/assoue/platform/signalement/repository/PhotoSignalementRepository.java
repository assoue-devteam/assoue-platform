package bf.assoue.platform.signalement.repository;

import bf.assoue.platform.signalement.model.PhotoSignalement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PhotoSignalementRepository extends JpaRepository<PhotoSignalement, Long> {

    List<PhotoSignalement> findBySignalementId(Long signalementId);

    Optional<PhotoSignalement> findByCle(String cle);
}