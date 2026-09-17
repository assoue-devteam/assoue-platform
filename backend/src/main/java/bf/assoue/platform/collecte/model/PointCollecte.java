package bf.assoue.platform.collecte.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Lieu physique où s'effectue la collecte — un lieu, pas un événement
 * (voir docs/domaine-metier.md, à ne pas confondre avec Depot ou Collecte).
 */
@Entity
@Table(name = "point_collecte")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointCollecte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

}
