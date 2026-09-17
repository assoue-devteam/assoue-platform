package bf.assoue.platform.collecte.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Nomenclature des types de déchets valorisés (plastique, pneu…) — pas une quantité,
 * voir docs/domaine-metier.md.
 */
@Entity
@Table(name = "materiau")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Materiau {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    @Column(nullable = false, length = 10)
    private String unite;

}
