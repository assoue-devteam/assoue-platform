package bf.assoue.platform.stock.model;

import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.Produit;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reservation_stock", uniqueConstraints = @UniqueConstraint(columnNames = {"commande_id", "produit_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "commande_id", nullable = false)
    private Commande commande;

    @ManyToOne(optional = false)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Column(nullable = false)
    private int quantite;
}
