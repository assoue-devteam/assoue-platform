package bf.assoue.platform.collecte.repository;

import bf.assoue.platform.collecte.model.Collecte;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollecteRepository extends JpaRepository<Collecte, Long> {

    Optional<Collecte> findByReferenceClient(String referenceClient);

    /** Une seule requête : tout ce que les réponses lisent (collecteur, point, lignes, matériaux). */
    @EntityGraph(attributePaths = {"collecteur", "pointCollecte", "depot", "lignes", "lignes.materiau"})
    List<Collecte> findByCollecteurEmailOrderByDateDeclarationDesc(String email);

    @EntityGraph(attributePaths = {"collecteur", "pointCollecte", "depot", "lignes", "lignes.materiau"})
    List<Collecte> findAllByOrderByDateDeclarationDesc();

    @EntityGraph(attributePaths = {"collecteur", "pointCollecte", "depot", "lignes", "lignes.materiau"})
    List<Collecte> findByCollecteurIdOrderByDateDeclarationDesc(Long collecteurId);

}
