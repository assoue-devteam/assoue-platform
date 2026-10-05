package bf.assoue.platform.communaute.service;

import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.communaute.dto.ChiffreResponse;
import bf.assoue.platform.communaute.dto.ChiffresRequest;
import bf.assoue.platform.communaute.dto.EvenementRequest;
import bf.assoue.platform.communaute.dto.EvenementResponse;
import bf.assoue.platform.communaute.model.ChiffreCommunaute;
import bf.assoue.platform.communaute.model.Evenement;
import bf.assoue.platform.communaute.repository.ChiffreCommunauteRepository;
import bf.assoue.platform.communaute.repository.EvenementRepository;
import bf.assoue.platform.images.ImageService;
import bf.assoue.platform.images.SuppressionImageApresCommit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunauteServiceTest {

    @Mock
    private EvenementRepository evenementRepository;
    @Mock
    private ChiffreCommunauteRepository chiffreRepository;
    @Mock
    private ImageService imageService;
    @Mock
    private SuppressionImageApresCommit nettoyageImage;

    @InjectMocks
    private CommunauteService communauteService;

    private final LocalDateTime date = LocalDateTime.of(2026, 12, 15, 9, 0);

    @Test
    void creer_nettoieLesChampsEtTransformeLesVidesEnNull() {
        when(evenementRepository.save(any(Evenement.class))).thenAnswer(appel -> appel.getArgument(0));

        EvenementResponse cree = communauteService.creer(new EvenementRequest(
                "  Atelier de recyclage créatif ", date, " Centre AS'SOUÉ, Bobo-Dioulasso ", "   ", "", null, 15));

        assertThat(cree.titre()).isEqualTo("Atelier de recyclage créatif");
        assertThat(cree.lieu()).isEqualTo("Centre AS'SOUÉ, Bobo-Dioulasso");
        assertThat(cree.description()).isNull();
        assertThat(cree.imageUrl()).isNull();
        assertThat(cree.placesRestantes()).isEqualTo(15);
    }

    @Test
    void modifier_refuseUnEvenementInconnu() {
        when(evenementRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> communauteService.modifier(99L, new EvenementRequest("Atelier", date, "Ouaga", null, null, null, null)))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

    @Test
    void supprimer_refuseUnEvenementInconnu() {
        when(evenementRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> communauteService.supprimer(99L)).isInstanceOf(RessourceIntrouvableException.class);
        verify(evenementRepository, never()).delete(any());
    }

    @Test
    void creer_avecImageCleLaExposeEtVideImageUrl() {
        when(evenementRepository.save(any(Evenement.class))).thenAnswer(appel -> appel.getArgument(0));
        String cle = "11111111-2222-3333-4444-555555555555.png";
        when(imageService.validerCleExistante(cle)).thenReturn(cle);

        EvenementResponse cree = communauteService.creer(new EvenementRequest(
                "Atelier", date, "Ouaga", null, "https://cdn.example.com/ancien.jpg", cle, null));

        assertThat(cree.imageCle()).isEqualTo(cle);
        assertThat(cree.imageUrl()).isEqualTo("/api/images/" + cle);
    }

    @Test
    void supprimer_nettoieLeFichierImage() {
        Evenement evenement = Evenement.builder().id(7L).titre("Atelier")
                .dateDebut(date).lieu("Ouaga")
                .imageCle("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg").build();
        when(evenementRepository.findById(7L)).thenReturn(Optional.of(evenement));

        communauteService.supprimer(7L);

        verify(evenementRepository).delete(evenement);
        verify(nettoyageImage).supprimer("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg");
    }

    @Test
    @SuppressWarnings("unchecked")
    void remplacerChiffres_gardeLOrdreDeSaisie() {
        when(chiffreRepository.saveAll(any())).thenAnswer(appel -> appel.getArgument(0));

        List<ChiffreResponse> chiffres = communauteService.remplacerChiffres(new ChiffresRequest(List.of(
                new ChiffresRequest.Chiffre(" Artisans soutenus ", 245),
                new ChiffresRequest.Chiffre("Villes couvertes", 47))));

        ArgumentCaptor<List<ChiffreCommunaute>> enregistres = ArgumentCaptor.forClass(List.class);
        verify(chiffreRepository).deleteAllInBatch();
        verify(chiffreRepository).saveAll(enregistres.capture());
        assertThat(enregistres.getValue()).extracting(ChiffreCommunaute::getOrdre).containsExactly(0, 1);
        assertThat(chiffres).containsExactly(new ChiffreResponse("Artisans soutenus", 245), new ChiffreResponse("Villes couvertes", 47));
    }

}
