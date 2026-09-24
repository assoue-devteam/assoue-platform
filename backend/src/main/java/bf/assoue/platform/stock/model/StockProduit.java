package bf.assoue.platform.stock.model;

import bf.assoue.platform.commerce.model.Produit;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "stock_produit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockProduit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "produit_id", nullable = false, unique = true)
    private Produit produit;

    @Column(nullable = false)
    @Builder.Default
    private int quantite = 0;

    @Version
    private Long version;

}
