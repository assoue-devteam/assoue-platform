package bf.assoue.platform.signalement.repository;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.signalement.model.MouvementPoints;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MouvementPointsRepository extends JpaRepository<MouvementPoints, Long> {

    Page<MouvementPoints> findByClient(Utilisateur client, Pageable pageable);

    @Query("SELECT COALESCE(SUM(m.points), 0) FROM MouvementPoints m WHERE m.client = :client")
    int calculerSolde(@Param("client") Utilisateur client);

    Optional<MouvementPoints> findByClientAndTypeAndTypeId(Utilisateur client, String type, Long typeId);
}