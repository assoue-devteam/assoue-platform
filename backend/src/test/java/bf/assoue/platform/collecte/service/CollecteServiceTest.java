package bf.assoue.platform.collecte.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.collecte.dto.CollecteResponse;
import bf.assoue.platform.collecte.dto.DeclarationCollecteRequest;
import bf.assoue.platform.collecte.dto.LocalisationRequest;
import bf.assoue.platform.collecte.model.Collecte;
import bf.assoue.platform.collecte.model.Materiau;
import bf.assoue.platform.collecte.model.PointCollecte;
import bf.assoue.platform.collecte.repository.CollecteRepository;
import bf.assoue.platform.collecte.repository.MateriauRepository;
import bf.assoue.platform.collecte.repository.PointCollecteRepository;
import bf.assoue.platform.stock.service.StockService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
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

}
