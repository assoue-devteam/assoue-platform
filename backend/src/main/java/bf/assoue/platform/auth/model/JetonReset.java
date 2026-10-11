package bf.assoue.platform.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "jeton_reset")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JetonReset {

    @Id
    @Column(name = "jti")
    private String jti;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "consomme", nullable = false)
    @Builder.Default
    private boolean consomme = false;

    @Column(name = "date_creation", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(name = "date_consommation")
    private LocalDateTime dateConsommation;
}
