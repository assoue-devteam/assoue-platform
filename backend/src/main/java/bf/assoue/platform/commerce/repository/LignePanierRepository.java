package bf.assoue.platform.commerce.repository;

import bf.assoue.platform.commerce.model.LignePanier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LignePanierRepository extends JpaRepository<LignePanier, Long> {

    List<LignePanier> findByClientEmailOrderByIdAsc(String email);

    void deleteByClientId(Long clientId);

}
