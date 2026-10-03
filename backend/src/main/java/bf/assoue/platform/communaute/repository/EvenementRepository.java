package bf.assoue.platform.communaute.repository;

import bf.assoue.platform.communaute.model.Evenement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvenementRepository extends JpaRepository<Evenement, Long> {

    List<Evenement> findAllByOrderByDateDebutAsc();

}
