package bf.assoue.platform.signalement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "mouvement_points")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MouvementPoints {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private bf.assoue.platform.auth.model.Utilisateur client;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false)
    private int points;

    @Column(name = "type_id")
    private Long typeId;

    @Column(name = "solde_apres", nullable = false)
    private int soldeApres;

    @Column(name = "date_creation", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();
}