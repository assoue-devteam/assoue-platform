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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class CommunauteService {

    private final EvenementRepository evenementRepository;
    private final ChiffreCommunauteRepository chiffreRepository;

    @Transactional(readOnly = true)
    public List<EvenementResponse> evenements() {
        return evenementRepository.findAllByOrderByDateDebutAsc().stream().map(EvenementResponse::depuis).toList();
    }

    @Transactional
    public EvenementResponse creer(EvenementRequest requete) {
        Evenement evenement = new Evenement();
        appliquer(evenement, requete);
        return EvenementResponse.depuis(evenementRepository.save(evenement));
    }

    @Transactional
    public EvenementResponse modifier(Long id, EvenementRequest requete) {
        Evenement evenement = evenementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable : " + id));
        appliquer(evenement, requete);
        return EvenementResponse.depuis(evenementRepository.save(evenement));
    }

    @Transactional
    public void supprimer(Long id) {
        if (!evenementRepository.existsById(id)) {
            throw new RessourceIntrouvableException("Événement introuvable : " + id);
        }
        evenementRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ChiffreResponse> chiffres() {
        return chiffreRepository.findAllByOrderByOrdreAsc().stream().map(ChiffreResponse::depuis).toList();
    }

    @Transactional
    public List<ChiffreResponse> remplacerChiffres(ChiffresRequest requete) {
        chiffreRepository.deleteAllInBatch();
        List<ChiffresRequest.Chiffre> chiffres = requete.chiffres();
        List<ChiffreCommunaute> enregistres = chiffreRepository.saveAll(IntStream.range(0, chiffres.size())
                .mapToObj(i -> ChiffreCommunaute.builder()
                        .libelle(chiffres.get(i).libelle().trim())
                        .valeur(chiffres.get(i).valeur())
                        .ordre(i)
                        .build())
                .toList());
        return enregistres.stream().map(ChiffreResponse::depuis).toList();
    }

    private void appliquer(Evenement evenement, EvenementRequest requete) {
        evenement.setTitre(requete.titre().trim());
        evenement.setDateDebut(requete.dateDebut());
        evenement.setLieu(requete.lieu().trim());
        evenement.setDescription(videVersNull(requete.description()));
        evenement.setImageUrl(videVersNull(requete.imageUrl()));
        evenement.setPlacesRestantes(requete.placesRestantes());
    }

    private static String videVersNull(String texte) {
        return texte == null || texte.isBlank() ? null : texte.trim();
    }

}
