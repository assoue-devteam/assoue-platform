package bf.assoue.platform.collecte.repository;

import bf.assoue.platform.collecte.model.Collecte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollecteRepository extends JpaRepository<Collecte, Long> {

    Optional<Collecte> findByReferenceClient(String referenceClient);

    List<Collecte> findByCollecteurEmailOrderByDateDeclarationDesc(String email);

    List<Collecte> findAllByOrderByDateDeclarationDesc();

    List<Collecte> findByCollecteurIdOrderByDateDeclarationDesc(Long collecteurId);

}
