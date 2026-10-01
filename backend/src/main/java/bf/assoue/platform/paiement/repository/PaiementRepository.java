package bf.assoue.platform.paiement.repository;

import bf.assoue.platform.paiement.model.Paiement;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    Optional<Paiement> findByCommandeId(Long commandeId);

    Optional<Paiement> findByTokenPaydunya(String tokenPaydunya);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select paiement from Paiement paiement where paiement.tokenPaydunya = :token")
    Optional<Paiement> findByTokenPaydunyaForUpdate(@Param("token") String token);

    List<Paiement> findAllByOrderByDateCreationDesc();

}
