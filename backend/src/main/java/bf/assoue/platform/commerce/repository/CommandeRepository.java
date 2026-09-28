package bf.assoue.platform.commerce.repository;

import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    List<Commande> findByClientEmailOrderByDateCreationDesc(String email);

    List<Commande> findByStatutAndDateCreationBeforeOrderByDateCreationAsc(CommandeStatut statut, LocalDateTime avant);

    List<Commande> findAllByOrderByDateCreationDesc();

    List<Commande> findByStatutOrderByDateCreationDesc(CommandeStatut statut);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select commande from Commande commande where commande.id = :id")
    java.util.Optional<Commande> findByIdForUpdate(@Param("id") Long id);

}
