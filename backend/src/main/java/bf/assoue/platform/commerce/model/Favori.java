package bf.assoue.platform.commerce.model;

import bf.assoue.platform.auth.model.Utilisateur;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "favori")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Favori {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur client;

    @ManyToOne(optional = false)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Column(name = "date_ajout", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateAjout = LocalDateTime.now();

}
