package bf.assoue.platform.stock.model;

import bf.assoue.platform.collecte.model.Materiau;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "stock_matiere_premiere")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMatierePremiere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "materiau_id", nullable = false, unique = true)
    private Materiau materiau;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal quantite = BigDecimal.ZERO;

    @Version
    private Long version;

}
