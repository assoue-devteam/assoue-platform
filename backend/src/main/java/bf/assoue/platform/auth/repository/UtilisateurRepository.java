package bf.assoue.platform.auth.repository;

import bf.assoue.platform.auth.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    @Modifying
    @Query("""
            update Utilisateur utilisateur
            set utilisateur.tentativesEchouees = utilisateur.tentativesEchouees + 1
            where utilisateur.email = :email
              and utilisateur.tentativesEchouees < :limite
            """)
    int incrementerTentativesEchouees(@Param("email") String email, @Param("limite") int limite);

}
