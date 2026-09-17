package bf.assoue.platform.collecte.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Rétribution optionnelle liée à un Dépôt — reste optionnelle, ne pas la rendre
 * obligatoire dans le modèle (voir docs/domaine-metier.md).
 */
@Entity
@Table(name = "compensation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Compensation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "depot_id", nullable = false, unique = true)
    private Depot depot;

    @Column(nullable = false)
    private BigDecimal montant;

    @Column(name = "date_versement")
    private LocalDateTime dateVersement;

}
