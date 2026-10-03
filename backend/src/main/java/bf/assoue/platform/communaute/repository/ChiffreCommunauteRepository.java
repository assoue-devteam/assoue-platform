package bf.assoue.platform.communaute.repository;

import bf.assoue.platform.communaute.model.ChiffreCommunaute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChiffreCommunauteRepository extends JpaRepository<ChiffreCommunaute, Long> {

    List<ChiffreCommunaute> findAllByOrderByOrdreAsc();

}
