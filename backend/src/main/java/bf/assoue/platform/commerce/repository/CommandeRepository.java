package bf.assoue.platform.commerce.repository;

import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    /** Une seule requête : client, lignes et produits (une collection + ToOne, pas de sacs multiples). */
    @EntityGraph(attributePaths = {"client", "lignes", "lignes.produit"})
    List<Commande> findByClientEmailOrderByDateCreationDesc(String email);

    @EntityGraph(attributePaths = {"client", "lignes", "lignes.produit"})
    List<Commande> findByStatutAndDateCreationBeforeOrderByDateCreationAsc(CommandeStatut statut, LocalDateTime avant);

    @EntityGraph(attributePaths = {"client", "lignes", "lignes.produit"})
    List<Commande> findAllByOrderByDateCreationDesc();

    @EntityGraph(attributePaths = {"client", "lignes", "lignes.produit"})
    List<Commande> findByStatutOrderByDateCreationDesc(CommandeStatut statut);

    /** Initiation du paiement : tout est chargé dans la requête (méthode hors transaction). */
    @EntityGraph(attributePaths = {"client", "lignes", "lignes.produit"})
    java.util.Optional<Commande> findAvecLignesById(@Param("id") Long id);

    /** Le client a-t-il une commande dans l'un de ces statuts qui contient ce produit ? */
    @Query("""
            select count(commande) > 0 from Commande commande join commande.lignes ligne
            where commande.client.email = :email and ligne.produit.id = :produitId and commande.statut in :statuts
            """)
    boolean aAchete(@Param("email") String email, @Param("produitId") Long produitId,
                    @Param("statuts") java.util.Collection<CommandeStatut> statuts);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select commande from Commande commande where commande.id = :id")
    java.util.Optional<Commande> findByIdForUpdate(@Param("id") Long id);

}
