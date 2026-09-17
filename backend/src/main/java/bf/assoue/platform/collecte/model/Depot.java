package bf.assoue.platform.collecte.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Dépôt de déchets déclaré par le fournisseur — pas à confondre avec PointCollecte
 * (voir docs/domaine-metier.md). Pas de compte Fournisseur dans cette itération,
 * ses coordonnées sont saisies en texte libre par qui déclare le dépôt.
 */
@Entity
@Table(name = "depot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Depot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_fournisseur", nullable = false)
    private String nomFournisseur;

    @Column(name = "contact_fournisseur")
    private String contactFournisseur;

    @ManyToOne(optional = false)
    @JoinColumn(name = "point_collecte_id", nullable = false)
    private PointCollecte pointCollecte;

    @Column(name = "date_declaration", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateDeclaration = LocalDateTime.now();

}
