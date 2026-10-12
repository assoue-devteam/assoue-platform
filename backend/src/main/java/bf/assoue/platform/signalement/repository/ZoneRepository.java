package bf.assoue.platform.signalement.repository;

import bf.assoue.platform.signalement.model.Zone;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ZoneRepository extends JpaRepository<Zone, Long> {

    List<Zone> findByActifTrueOrderByNomAsc();

    Page<Zone> findByActifTrueOrderByNomAsc(Pageable pageable);

    Optional<Zone> findByNomIgnoreCase(String nom);
}