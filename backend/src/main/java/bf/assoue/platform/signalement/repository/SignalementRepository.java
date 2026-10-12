package bf.assoue.platform.signalement.repository;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.signalement.model.Signalement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SignalementRepository extends JpaRepository<Signalement, Long> {

    Page<Signalement> findByClient(Utilisateur client, Pageable pageable);

    Page<Signalement> findByStatut(String statut, Pageable pageable);

    List<Signalement> findByZoneAndDateCreationBetween(bf.assoue.platform.signalement.model.Zone zone, java.time.LocalDateTime debut, java.time.LocalDateTime fin);

    Optional<Signalement> findByClientAndZoneAndDateCreationBetween(Utilisateur client, bf.assoue.platform.signalement.model.Zone zone, java.time.LocalDateTime debut, java.time.LocalDateTime fin);

    long countByClientAndDateCreationBetween(Utilisateur client, java.time.LocalDateTime debut, java.time.LocalDateTime fin);
}