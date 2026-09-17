package bf.assoue.platform.collecte.model;

import bf.assoue.platform.auth.model.Utilisateur;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * La tournée du collecteur elle-même (l'événement, mode hors-ligne) — pas le lieu
 * ni le dépôt (voir docs/domaine-metier.md). `referenceClient` est l'UUID généré
 * côté frontend au moment de la saisie hors-ligne (IndexedDB) : sert de verrou
 * anti-doublon quand la déclaration est synchronisée au retour réseau (US-03).
 */
@Entity
@Table(name = "collecte")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Collecte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_client", nullable = false, unique = true)
    private String referenceClient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "collecteur_id", nullable = false)
    private Utilisateur collecteur;

    @ManyToOne(optional = false)
    @JoinColumn(name = "point_collecte_id", nullable = false)
    private PointCollecte pointCollecte;

    @ManyToOne
    @JoinColumn(name = "depot_id")
    private Depot depot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CollecteStatut statut = CollecteStatut.DECLAREE;

    @Column(name = "date_declaration", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateDeclaration = LocalDateTime.now();

    @OneToMany(mappedBy = "collecte", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneCollecte> lignes = new ArrayList<>();

}
