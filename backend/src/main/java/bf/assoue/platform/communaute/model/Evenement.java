package bf.assoue.platform.communaute.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Événement affiché sur la page Communauté (atelier, salon, journée de collecte).
 * Simple vitrine : « Participer » ouvre WhatsApp, aucune inscription n'est gérée ici
 * (le pilier Formation, qui porte les inscriptions, est hors scope).
 */
@Entity
@Table(name = "evenement")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evenement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(nullable = false, length = 200)
    private String lieu;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /** Clé d'image uploadée (lot 8) : imageUrl legacy (https) conservée pour l'existant. */
    @Column(name = "image_cle", length = 100)
    private String imageCle;

    // Information saisie par l'admin, pas un compteur tenu par le système.
    @Column(name = "places_restantes")
    private Integer placesRestantes;

    @Column(name = "date_creation", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

}
