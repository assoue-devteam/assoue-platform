package bf.assoue.platform.common.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByDestinataireAndLue(String destinataire, boolean lue, Pageable pageable);

    Page<Notification> findByDestinataire(String destinataire, Pageable pageable);

    long countByDestinataireAndLue(String destinataire, boolean lue);

    @Modifying
    @Query("UPDATE Notification n SET n.lue = true WHERE n.id = :id AND n.destinataire = :destinataire")
    int marquerLue(@Param("id") Long id, @Param("destinataire") String destinataire);

    @Modifying
    @Query("UPDATE Notification n SET n.lue = true WHERE n.destinataire = :destinataire")
    int marquerToutesLues(@Param("destinataire") String destinataire);
}
