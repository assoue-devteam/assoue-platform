package bf.assoue.platform.collecte.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Classe d'association entre Collecte et Matériau — porte la quantité d'un
 * matériau donné dans une tournée (voir docs/domaine-metier.md).
 */
@Entity
@Table(name = "ligne_collecte")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneCollecte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "collecte_id", nullable = false)
    private Collecte collecte;

    @ManyToOne(optional = false)
    @JoinColumn(name = "materiau_id", nullable = false)
    private Materiau materiau;

    @Column(name = "quantite_estimee", nullable = false)
    private BigDecimal quantiteEstimee;

}
