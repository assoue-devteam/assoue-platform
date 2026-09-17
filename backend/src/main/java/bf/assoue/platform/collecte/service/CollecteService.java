package bf.assoue.platform.collecte.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.collecte.dto.CollecteResponse;
import bf.assoue.platform.collecte.dto.DeclarationCollecteRequest;
import bf.assoue.platform.collecte.model.*;
import bf.assoue.platform.collecte.repository.CollecteRepository;
import bf.assoue.platform.collecte.repository.MateriauRepository;
import bf.assoue.platform.collecte.repository.PointCollecteRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CollecteService {

    private final CollecteRepository collecteRepository;
    private final PointCollecteRepository pointCollecteRepository;
    private final MateriauRepository materiauRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StockService stockService;

    @Transactional
    public CollecteResponse declarer(DeclarationCollecteRequest requete, String emailCollecteur) {
        // Verrou anti-doublon à la synchronisation (US-03) : une déclaration déjà
        // synchronisée avec cette référence renvoie son état actuel au lieu d'en recréer une.
        var dejaSynchronisee = collecteRepository.findByReferenceClient(requete.referenceClient());
        if (dejaSynchronisee.isPresent()) {
            return CollecteResponse.depuis(dejaSynchronisee.get());
        }

        Utilisateur collecteur = utilisateurRepository.findByEmail(emailCollecteur)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable : " + emailCollecteur));

        Materiau materiau = materiauRepository.findById(requete.materiauId())
                .orElseThrow(() -> new RessourceIntrouvableException("Matériau introuvable : " + requete.materiauId()));

        PointCollecte pointCollecte = pointCollecteRepository
                .findByLatitudeAndLongitude(requete.localisation().lat(), requete.localisation().lng())
                .orElseGet(() -> pointCollecteRepository.save(PointCollecte.builder()
                        .latitude(requete.localisation().lat())
                        .longitude(requete.localisation().lng())
                        .build()));

        Collecte collecte = Collecte.builder()
                .referenceClient(requete.referenceClient())
                .collecteur(collecteur)
                .pointCollecte(pointCollecte)
                .build();

        LigneCollecte ligne = LigneCollecte.builder()
                .collecte(collecte)
                .materiau(materiau)
                .quantiteEstimee(requete.quantiteEstimee())
                .build();
        collecte.getLignes().add(ligne);

        return CollecteResponse.depuis(collecteRepository.save(collecte));
    }

    public List<CollecteResponse> mesCollectes(String emailCollecteur) {
        return collecteRepository.findByCollecteurEmailOrderByDateDeclarationDesc(emailCollecteur).stream()
                .map(CollecteResponse::depuis)
                .toList();
    }

    @Transactional
    public CollecteResponse valider(Long collecteId) {
        Collecte collecte = trouver(collecteId);
        collecte.setStatut(CollecteStatut.VALIDEE);
        return CollecteResponse.depuis(collecteRepository.save(collecte));
    }

    @Transactional
    public CollecteResponse traiter(Long collecteId) {
        Collecte collecte = trouver(collecteId);

        if (collecte.getStatut() != CollecteStatut.VALIDEE) {
            throw new RequeteInvalideException("Seule une collecte validée peut être traitée par l'atelier");
        }

        // US-05 : la déclaration traitée par l'atelier incrémente le stock de matière première.
        collecte.getLignes().forEach(ligne ->
                stockService.incrementerStockMatierePremiere(ligne.getMateriau(), ligne.getQuantiteEstimee()));

        collecte.setStatut(CollecteStatut.TRAITEE);
        return CollecteResponse.depuis(collecteRepository.save(collecte));
    }

    private Collecte trouver(Long id) {
        return collecteRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Collecte introuvable : " + id));
    }

}
