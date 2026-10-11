package bf.assoue.platform.signalement.repository;

import bf.assoue.platform.signalement.model.Zone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ZoneRepository extends JpaRepository<Zone, Long> {

    List<Zone> findByActifTrueOrderByNomAsc();

    Optional<Zone> findByNomIgnoreCase(String nom);
}