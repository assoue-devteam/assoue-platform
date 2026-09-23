package bf.assoue.platform.commerce.repository;

import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    List<Commande> findByClientEmailOrderByDateCreationDesc(String email);

    List<Commande> findByStatutAndDateCreationBeforeOrderByDateCreationAsc(CommandeStatut statut, LocalDateTime avant);

}
