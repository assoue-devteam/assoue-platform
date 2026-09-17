package bf.assoue.platform.paiement.repository;

import bf.assoue.platform.paiement.model.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    Optional<Paiement> findByCommandeId(Long commandeId);

    Optional<Paiement> findByTokenPaydunya(String tokenPaydunya);

}
