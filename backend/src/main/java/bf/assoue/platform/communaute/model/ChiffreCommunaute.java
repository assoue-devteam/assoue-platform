package bf.assoue.platform.communaute.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Chiffre affiché sur la page Communauté (« Artisans soutenus : 245 »), saisi par l'admin. */
@Entity
@Table(name = "chiffre_communaute")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChiffreCommunaute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String libelle;

    @Column(nullable = false)
    private int valeur;

    @Column(nullable = false)
    private int ordre;

}
