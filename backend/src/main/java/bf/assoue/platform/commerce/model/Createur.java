package bf.assoue.platform.commerce.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Conçoit les modèles de produits valorisés — entité métier simple, pas de compte utilisateur
 * (décision projet, voir CLAUDE.md).
 */
@Entity
@Table(name = "createur")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Createur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    private String contact;

}
