package bf.assoue.platform.signalement.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.signalement.dto.MouvementPointsResponse;
import bf.assoue.platform.signalement.dto.PointsResponse;
import bf.assoue.platform.signalement.model.MouvementPoints;
import bf.assoue.platform.signalement.model.Signalement;
import bf.assoue.platform.signalement.repository.MouvementPointsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PointsService {

    private final MouvementPointsRepository mouvementPointsRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PointsProperties pointsProperties;

    @Transactional(readOnly = true)
    public PointsResponse.SoldePointsResponse solde(String emailClient) {
        Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RequeteInvalideException("Client introuvable : " + emailClient));
        int solde = mouvementPointsRepository.calculerSolde(client);
        return new PointsResponse.SoldePointsResponse(solde);
    }

    @Transactional(readOnly = true)
    public Page<MouvementPointsResponse> mouvements(String emailClient, Pageable pageable) {
        Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RequeteInvalideException("Client introuvable : " + emailClient));
        return mouvementPointsRepository.findByClient(client, pageable).map(MouvementPointsResponse::de);
    }

    @Transactional
    public void crediterPourSignalement(Signalement signalement) {
        if (!pointsProperties.isActif()) return;

        Utilisateur client = signalement.getClient();
        int points = pointsProperties.getPointsParSignalement();

        MouvementPoints mouvement = MouvementPoints.builder()
                .client(client)
                .type("GAIN")
                .points(points)
                .typeId(signalement.getId())
                .soldeApres(calculerNouveauSolde(client, points))
                .build();
        mouvementPointsRepository.save(mouvement);
    }

    @Transactional
    public int utiliserPourCommande(String emailClient, int pointsDemandes, Long commandeId) {
        if (!pointsProperties.isActif()) {
            throw new RequeteInvalideException("Le système de points n'est pas actif.");
        }
        Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RequeteInvalideException("Client introuvable : " + emailClient));

        int solde = mouvementPointsRepository.calculerSolde(client);
        if (solde < pointsDemandes) {
            throw new RequeteInvalideException("Solde insuffisant : " + solde + " points disponibles.");
        }

        MouvementPoints mouvement = MouvementPoints.builder()
                .client(client)
                .type("UTILISATION")
                .points(-pointsDemandes)
                .typeId(commandeId)
                .soldeApres(solde - pointsDemandes)
                .build();
        mouvementPointsRepository.save(mouvement);
        return pointsDemandes;
    }

    @Transactional
    public void annulerUtilisation(String emailClient, Long commandeId) {
        Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RequeteInvalideException("Client introuvable : " + emailClient));
        var mouvement = mouvementPointsRepository.findByClientAndTypeAndTypeId(client, "UTILISATION", commandeId);
        if (mouvement.isPresent() && !mouvement.get().getType().equals("ANNULATION")) {
            int points = -mouvement.get().getPoints();
            int nouveauSolde = mouvementPointsRepository.calculerSolde(client) + points;
            MouvementPoints annulation = MouvementPoints.builder()
                    .client(client)
                    .type("ANNULATION")
                    .points(points)
                    .typeId(commandeId)
                    .soldeApres(nouveauSolde)
                    .build();
            mouvementPointsRepository.save(annulation);
        }
    }

    private int calculerNouveauSolde(Utilisateur client, int delta) {
        return mouvementPointsRepository.calculerSolde(client) + delta;
    }
}