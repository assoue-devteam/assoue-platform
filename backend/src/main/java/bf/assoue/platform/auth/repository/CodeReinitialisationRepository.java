package bf.assoue.platform.auth.repository;

import bf.assoue.platform.auth.model.CodeReinitialisation;
import bf.assoue.platform.auth.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CodeReinitialisationRepository extends JpaRepository<CodeReinitialisation, Long> {

    Optional<CodeReinitialisation> findFirstByUtilisateurAndConsommeFalseAndDateExpirationAfterOrderByDateCreationDesc(
            Utilisateur utilisateur, LocalDateTime maintenant);

    List<CodeReinitialisation> findByUtilisateurAndDateCreationAfter(Utilisateur utilisateur, LocalDateTime apres);

    List<CodeReinitialisation> findByUtilisateurAndConsommeFalseAndDateExpirationAfter(Utilisateur utilisateur, LocalDateTime maintenant);
}
