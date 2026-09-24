package bf.assoue.platform.collecte.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.collecte.dto.CollecteAdminResponse;
import bf.assoue.platform.collecte.dto.CollecteResponse;
import bf.assoue.platform.collecte.dto.DeclarationCollecteRequest;
import bf.assoue.platform.collecte.dto.LocalisationRequest;
import bf.assoue.platform.collecte.dto.ModificationCollecteRequest;
import bf.assoue.platform.collecte.dto.VolumeCollecteResponse;
import bf.assoue.platform.collecte.model.Collecte;
import bf.assoue.platform.collecte.model.CollecteStatut;
import bf.assoue.platform.collecte.model.LigneCollecte;
import bf.assoue.platform.collecte.model.Materiau;
import bf.assoue.platform.collecte.model.PointCollecte;
import bf.assoue.platform.collecte.repository.CollecteRepository;
import bf.assoue.platform.collecte.repository.MateriauRepository;
import bf.assoue.platform.collecte.repository.PointCollecteRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.service.StockService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CollecteServiceTest {

    @Mock
    private CollecteRepository collecteRepository;
    @Mock
    private PointCollecteRepository pointCollecteRepository;
    @Mock
    private MateriauRepository materiauRepository;
    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private StockService stockService;

    @InjectMocks
    private CollecteService collecteService;

    @Test
    void declarer_renvoieLaCollecteExistante_siReferenceClientDejaSynchronisee() {
        String referenceClient = "uuid-frontend-123";
        Collecte existante = Collecte.builder()
                .id(1L)
                .referenceClient(referenceClient)
                .collecteur(Utilisateur.builder().id(1L).email("collecteur@example.com").build())
                .pointCollecte(PointCollecte.builder().latitude(12.3).longitude(-1.5).build())
                .build();

        when(collecteRepository.findByReferenceClient(referenceClient)).thenReturn(Optional.of(existante));

        DeclarationCollecteRequest requete = new DeclarationCollecteRequest(
                referenceClient, 1L, BigDecimal.TEN, new LocalisationRequest(12.3, -1.5));

        CollecteResponse reponse = collecteService.declarer(requete, "collecteur@example.com");

        assertThat(reponse.id()).isEqualTo(1L);
        verify(collecteRepository, never()).save(any());
        verifyNoInteractions(materiauRepository, utilisateurRepository);
    }

    @Test
    void declarer_refuseRenvoiCollecteExistante_siAppartientAUnAutreCollecteur() {
        String referenceClient = "uuid-frontend-123";
        Collecte existante = Collecte.builder()
                .id(1L)
                .referenceClient(referenceClient)
                .collecteur(Utilisateur.builder().id(2L).email("autre@example.com").build())
                .pointCollecte(PointCollecte.builder().latitude(12.3).longitude(-1.5).build())
                .build();

        when(collecteRepository.findByReferenceClient(referenceClient)).thenReturn(Optional.of(existante));

        DeclarationCollecteRequest requete = new DeclarationCollecteRequest(
                referenceClient, 1L, BigDecimal.TEN, new LocalisationRequest(12.3, -1.5));

        assertThatThrownBy(() -> collecteService.declarer(requete, "collecteur@example.com"))
                .isInstanceOf(RequeteInvalideException.class)
                .hasMessageContaining("autre collecteur");

        verify(collecteRepository, never()).save(any());
    }

    @Test
    void declarer_creeUneNouvelleCollecte_siReferenceClientInedite() {
        String referenceClient = "uuid-frontend-456";
        when(collecteRepository.findByReferenceClient(referenceClient)).thenReturn(Optional.empty());
        when(utilisateurRepository.findByEmail("collecteur@example.com"))
                .thenReturn(Optional.of(Utilisateur.builder().id(1L).email("collecteur@example.com").build()));
        when(materiauRepository.findById(1L))
                .thenReturn(Optional.of(Materiau.builder().id(1L).nom("Plastique").unite("kg").build()));
        when(pointCollecteRepository.findByLatitudeAndLongitude(12.3, -1.5)).thenReturn(Optional.empty());
        when(pointCollecteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(collecteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DeclarationCollecteRequest requete = new DeclarationCollecteRequest(
                referenceClient, 1L, BigDecimal.TEN, new LocalisationRequest(12.3, -1.5));

        collecteService.declarer(requete, "collecteur@example.com");

        verify(collecteRepository).save(any());
    }

    @Test
    void modifier_metAJourMateriauEtQuantite_siLaCollecteEstEncoreDeclaree() {
        Collecte collecte = collecteDe(CollecteStatut.DECLAREE, "collecteur@example.com");
        when(collecteRepository.findById(1L)).thenReturn(Optional.of(collecte));
        when(materiauRepository.findById(2L))
                .thenReturn(Optional.of(Materiau.builder().id(2L).nom("Pneu").unite("kg").build()));
        when(pointCollecteRepository.findByLatitudeAndLongitude(12.4, -1.6))
                .thenReturn(Optional.of(PointCollecte.builder().latitude(12.4).longitude(-1.6).build()));
        when(collecteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CollecteResponse reponse = collecteService.modifier(1L,
                new ModificationCollecteRequest(2L, new BigDecimal("20.5"), new LocalisationRequest(12.4, -1.6)),
                "collecteur@example.com");

        assertThat(reponse.lignes()).singleElement()
                .satisfies(ligne -> {
                    assertThat(ligne.materiau()).isEqualTo("Pneu");
                    assertThat(ligne.quantiteEstimee()).isEqualByComparingTo("20.5");
                });
        assertThat(reponse.latitude()).isEqualTo(12.4);
    }

    @Test
    void modifier_refuseUneCollecteDejaValidee() {
        Collecte collecte = collecteDe(CollecteStatut.VALIDEE, "collecteur@example.com");
        when(collecteRepository.findById(1L)).thenReturn(Optional.of(collecte));

        assertThatThrownBy(() -> collecteService.modifier(1L,
                new ModificationCollecteRequest(2L, BigDecimal.TEN, new LocalisationRequest(12.4, -1.6)),
                "collecteur@example.com"))
                .isInstanceOf(RequeteInvalideException.class);

        verify(collecteRepository, never()).save(any());
    }

    @Test
    void modifier_refuseLaCollecteDUnAutreCollecteur() {
        Collecte collecte = collecteDe(CollecteStatut.DECLAREE, "autre@example.com");
        when(collecteRepository.findById(1L)).thenReturn(Optional.of(collecte));

        assertThatThrownBy(() -> collecteService.modifier(1L,
                new ModificationCollecteRequest(2L, BigDecimal.TEN, new LocalisationRequest(12.4, -1.6)),
                "collecteur@example.com"))
                .isInstanceOf(RessourceIntrouvableException.class);

        verify(collecteRepository, never()).save(any());
    }

    @Test
    void valider_refuseUneCollecteDejaTraitee() {
        Collecte collecte = collecteDe(CollecteStatut.TRAITEE, "collecteur@example.com");
        when(collecteRepository.findById(1L)).thenReturn(Optional.of(collecte));

        assertThatThrownBy(() -> collecteService.valider(1L))
                .isInstanceOf(RequeteInvalideException.class);

        verify(collecteRepository, never()).save(any());
    }

    @Test
    void volumes_cumuleLesQuantitesParCollecteurEtParMateriau() {
        Collecte premiere = collecteDe(CollecteStatut.TRAITEE, "collecteur@example.com");
        Collecte seconde = collecteDe(CollecteStatut.DECLAREE, "collecteur@example.com");
        when(collecteRepository.findAllByOrderByDateDeclarationDesc()).thenReturn(List.of(premiere, seconde));

        List<VolumeCollecteResponse> volumes = collecteService.volumes();

        assertThat(volumes).singleElement().satisfies(volume -> {
            assertThat(volume.collecteurEmail()).isEqualTo("collecteur@example.com");
            assertThat(volume.materiau()).isEqualTo("Plastique");
            assertThat(volume.quantiteTotale()).isEqualByComparingTo("20");
            assertThat(volume.nombreDeclarations()).isEqualTo(2);
        });
    }

    @Test
    void lister_filtreSurLeStatutDemande() {
        when(collecteRepository.findAllByOrderByDateDeclarationDesc()).thenReturn(List.of(
                collecteDe(CollecteStatut.DECLAREE, "collecteur@example.com"),
                collecteDe(CollecteStatut.TRAITEE, "autre@example.com")));

        assertThat(collecteService.lister(null, CollecteStatut.TRAITEE)).singleElement()
                .satisfies(collecte -> assertThat(collecte.collecteurEmail()).isEqualTo("autre@example.com"));
    }

    private Collecte collecteDe(CollecteStatut statut, String emailCollecteur) {
        Collecte collecte = Collecte.builder()
                .id(1L)
                .referenceClient("uuid-frontend-789")
                .statut(statut)
                .collecteur(Utilisateur.builder().id(1L).email(emailCollecteur).build())
                .pointCollecte(PointCollecte.builder().latitude(12.3).longitude(-1.5).build())
                .build();

        collecte.getLignes().add(LigneCollecte.builder()
                .collecte(collecte)
                .materiau(Materiau.builder().id(1L).nom("Plastique").unite("kg").build())
                .quantiteEstimee(BigDecimal.TEN)
                .build());

        return collecte;
    }

}
