package bf.assoue.platform.paiement.service;

import bf.assoue.platform.commerce.dto.CommandeResponse;
import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;
import bf.assoue.platform.commerce.repository.CommandeRepository;
import bf.assoue.platform.commerce.service.CommandeService;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.paiement.dto.PaiementResponse;
import bf.assoue.platform.paiement.dto.PaiementSuperviseResponse;
import bf.assoue.platform.paiement.model.Paiement;
import bf.assoue.platform.paiement.model.PaiementStatut;
import bf.assoue.platform.paiement.repository.PaiementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final CommandeRepository commandeRepository;
    private final CommandeService commandeService;
    private final PaydunyaClient paydunyaClient;
    private final PaydunyaProperties paydunyaProperties;

    @Transactional
    public PaiementResponse initier(Long commandeId, String emailClient) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RessourceIntrouvableException("Commande introuvable : " + commandeId));

        if (!commande.getClient().getEmail().equals(emailClient)) {
            throw new RessourceIntrouvableException("Commande introuvable : " + commandeId);
        }

        if (commande.getStatut() == CommandeStatut.PAYEE || commande.getStatut() == CommandeStatut.ANNULEE) {
            throw new RequeteInvalideException(
                    "Impossible d'initier un paiement pour une commande avec le statut : " + commande.getStatut());
        }

        Optional<Paiement> existant = paiementRepository.findByCommandeId(commandeId);
        if (existant.isPresent()) {
            Paiement paiementExistant = existant.get();
            return PaiementResponse.depuis(
                    paiementExistant,
                    paydunyaClient.urlPaiement(paiementExistant.getTokenPaydunya())
            );
        }

        BigDecimal total = CommandeResponse.depuis(commande).total();
        String callbackUrl = paydunyaProperties.callbackUrlEffectif();

        PaydunyaClient.InvoiceCree invoice = paydunyaClient.creerInvoice(
                total, "Commande AS'Soué n°" + commande.getId(), callbackUrl);

        Paiement paiement = Paiement.builder()
                .commande(commande)
                .montant(total)
                .tokenPaydunya(invoice.token())
                .build();
        paiementRepository.save(paiement);

        return PaiementResponse.depuis(paiement, invoice.urlPaiement());
    }

    /**
     * Reçoit l'appel webhook PayDunya mais ne se fie jamais à son contenu déclaré :
     * on revérifie le statut réel via l'API confirm avant de valider quoi que ce
     * soit (US-02, SA-06 — "aucune commande n'est validée sur une simple absence de réponse
     * ni sur la seule foi du contenu du webhook").
     * On enregistre également le statut prétendu par le webhook et l'heure de réception
     * pour permettre au super admin de détecter toute tentative de fraude ou divergence.
     */
    @Transactional
    public void traiterWebhook(Map<String, Object> payload) {
        String token = extraireToken(payload);
        String statutDeclare = extraireStatutDeclare(payload);

        Paiement paiement = paiementRepository.findByTokenPaydunya(token)
                .orElseThrow(() -> new RessourceIntrouvableException("Paiement introuvable pour le token " + token));

        paiement.setStatutAnnonceWebhook(statutDeclare);
        paiement.setDateDernierWebhook(LocalDateTime.now());

        if (paiement.getStatut() == PaiementStatut.CONFIRME) {
            paiementRepository.save(paiement);
            return;
        }

        boolean confirme = paydunyaClient.estConfirme(token);

        if (!confirme) {
            paiement.setStatut(PaiementStatut.ECHOUE);
            paiementRepository.save(paiement);
            return;
        }

        paiement.setStatut(PaiementStatut.CONFIRME);
        paiement.setDateConfirmation(LocalDateTime.now());
        paiementRepository.save(paiement);

        commandeService.marquerPayee(paiement.getCommande().getId());
    }

    @Transactional(readOnly = true)
    public List<PaiementSuperviseResponse> superviser() {
        return paiementRepository.findAllByOrderByDateCreationDesc().stream()
                .map(PaiementSuperviseResponse::depuis)
                .toList();
    }

    private String extraireToken(Map<String, Object> payload) {
        Object token = payload.get("token");
        if (token == null && payload.get("data") instanceof Map<?, ?> data) {
            token = data.get("token");
        }

        if (token == null) {
            throw new RequeteInvalideException("Webhook PayDunya sans token exploitable");
        }

        return token.toString();
    }

    private String extraireStatutDeclare(Map<String, Object> payload) {
        Object status = payload.get("status");
        if (status == null && payload.get("data") instanceof Map<?, ?> data) {
            status = data.get("status");
        }
        return status != null ? status.toString() : null;
    }

}
