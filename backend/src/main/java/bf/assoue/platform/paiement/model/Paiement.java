package bf.assoue.platform.paiement.model;

import bf.assoue.platform.commerce.model.Commande;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transaction liée à une commande — implémentée via PayDunya, jamais d'appel
 * direct Orange Money/Moov (décision projet, voir CLAUDE.md).
 */
@Entity
@Table(name = "paiement")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "commande_id", nullable = false, unique = true)
    private Commande commande;

    @Column(nullable = false)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaiementStatut statut = PaiementStatut.EN_ATTENTE;

    @Column(name = "token_paydunya", unique = true)
    private String tokenPaydunya;

    @Column(name = "date_creation", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(name = "date_confirmation")
    private LocalDateTime dateConfirmation;

}
