package bf.assoue.platform.paiement.service;

import bf.assoue.platform.commerce.dto.CommandeResponse;
import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.repository.CommandeRepository;
import bf.assoue.platform.commerce.service.CommandeService;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.paiement.dto.PaiementResponse;
import bf.assoue.platform.paiement.model.Paiement;
import bf.assoue.platform.paiement.model.PaiementStatut;
import bf.assoue.platform.paiement.repository.PaiementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final CommandeRepository commandeRepository;
    private final CommandeService commandeService;
    private final PaydunyaClient paydunyaClient;

    @Transactional
    public PaiementResponse initier(Long commandeId, String callbackUrl) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RessourceIntrouvableException("Commande introuvable : " + commandeId));

        BigDecimal total = CommandeResponse.depuis(commande).total();

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
     * soit (US-02 — "aucune commande n'est validée sur une simple absence de réponse").
     */
    @Transactional
    public void traiterWebhook(Map<String, Object> payload) {
        String token = extraireToken(payload);

        Paiement paiement = paiementRepository.findByTokenPaydunya(token)
                .orElseThrow(() -> new RessourceIntrouvableException("Paiement introuvable pour le token " + token));

        if (paiement.getStatut() == PaiementStatut.CONFIRME) {
            return;
        }

        boolean confirme = paydunyaClient.estConfirme(token);

        if (!confirme) {
            paiement.setStatut(PaiementStatut.ECHOUE);
            paiementRepository.save(paiement);
            return;
        }

        paiement.setStatut(PaiementStatut.CONFIRME);
        paiement.setDateConfirmation(java.time.LocalDateTime.now());
        paiementRepository.save(paiement);

        commandeService.marquerPayee(paiement.getCommande().getId());
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

}
