package bf.assoue.platform.commerce.repository;

import bf.assoue.platform.commerce.model.Commande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    List<Commande> findByClientEmailOrderByDateCreationDesc(String email);

}
