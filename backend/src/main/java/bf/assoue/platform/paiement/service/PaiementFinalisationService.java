package bf.assoue.platform.paiement.service;

import bf.assoue.platform.commerce.service.CommandeService;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.paiement.dto.PaydunyaWebhook;
import bf.assoue.platform.paiement.model.Paiement;
import bf.assoue.platform.paiement.model.PaiementStatut;
import bf.assoue.platform.paiement.repository.PaiementRepository;
import bf.assoue.platform.stock.service.ReservationStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaiementFinalisationService {

    private final PaiementRepository paiementRepository;
    private final CommandeService commandeService;
    private final ReservationStockService reservationStockService;

    @Transactional
    public void appliquer(String token, PaydunyaWebhook webhook, PaydunyaClient.Confirmation confirmation) {
        Paiement paiement = paiementRepository.findByTokenPaydunyaForUpdate(token)
                .orElseThrow(() -> new RessourceIntrouvableException("Paiement introuvable pour le token " + token));
        paiement.setStatutAnnonceWebhook(webhook.status());
        paiement.setDateDernierWebhook(LocalDateTime.now());

        if (paiement.getStatut() == PaiementStatut.CONFIRME) {
            paiementRepository.save(paiement);
            return;
        }
        if (!token.equals(confirmation.token())) {
            throw new RequeteInvalideException("Confirmation PayDunya incohérente avec le webhook");
        }
        if (confirmation.statut() == PaydunyaClient.StatutConfirmation.ECHOUE) {
            paiement.setStatut(PaiementStatut.ECHOUE);
            reservationStockService.liberer(paiement.getCommande().getId());
            paiementRepository.save(paiement);
            return;
        }
        if (confirmation.statut() != PaydunyaClient.StatutConfirmation.CONFIRME) {
            paiementRepository.save(paiement);
            return;
        }
        if (confirmation.montant() == null || paiement.getMontant().compareTo(confirmation.montant()) != 0) {
            throw new RequeteInvalideException("Montant confirmé par PayDunya incohérent");
        }

        commandeService.marquerPayee(paiement.getCommande().getId());
        paiement.setStatut(PaiementStatut.CONFIRME);
        paiement.setDateConfirmation(LocalDateTime.now());
        paiementRepository.save(paiement);
    }
}
