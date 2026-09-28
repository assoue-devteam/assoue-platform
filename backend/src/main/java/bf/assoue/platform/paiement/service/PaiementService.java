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
import bf.assoue.platform.paiement.dto.PaydunyaWebhook;
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
    private final PaydunyaClient paydunyaClient;
    private final PaydunyaProperties paydunyaProperties;
    private final PaydunyaSignatureVerifier paydunyaSignatureVerifier;
    private final PaiementFinalisationService paiementFinalisationService;

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

        BigDecimal total = CommandeResponse.depuis(commande).total();
        String callbackUrl = paydunyaProperties.callbackUrl();

        Optional<Paiement> existant = paiementRepository.findByCommandeId(commandeId);
        if (existant.isPresent()) {
            Paiement paiementExistant = existant.get();

            // Si le paiement est déjà confirmé, la garde statut au-dessus aurait dû bloquer,
            // mais par sécurité on le renvoit tel quel.
            if (paiementExistant.getStatut() == PaiementStatut.CONFIRME) {
                return PaiementResponse.depuis(
                        paiementExistant,
                        urlPaiement(paiementExistant)
                );
            }

            // Réutiliser le token existant seulement si l'invoice PayDunya est encore ouverte.
            // Si le token est expiré/invalide (ECHOUE ou invoice fermée côté PayDunya),
            // on régénère une nouvelle invoice et on met à jour l'enregistrement.
            if (paydunyaClient.estEnAttente(paiementExistant.getTokenPaydunya())) {
                return PaiementResponse.depuis(
                        paiementExistant,
                        urlPaiement(paiementExistant)
                );
            }

            // Token mort → recréer une invoice et mettre à jour le paiement existant
            PaydunyaClient.InvoiceCree nouvelleInvoice = paydunyaClient.creerInvoice(
                    total, "Commande AS'Soué n°" + commande.getId(), callbackUrl);
            paiementExistant.setTokenPaydunya(nouvelleInvoice.token());
            paiementExistant.setUrlPaydunya(nouvelleInvoice.urlPaiement());
            paiementExistant.setStatut(PaiementStatut.EN_ATTENTE);
            paiementRepository.save(paiementExistant);
            return PaiementResponse.depuis(paiementExistant, nouvelleInvoice.urlPaiement());
        }

        PaydunyaClient.InvoiceCree invoice = paydunyaClient.creerInvoice(
                total, "Commande AS'Soué n°" + commande.getId(), callbackUrl);

        Paiement paiement = Paiement.builder()
                .commande(commande)
                .montant(total)
                .tokenPaydunya(invoice.token())
                .urlPaydunya(invoice.urlPaiement())
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
    public void traiterWebhook(PaydunyaWebhook webhook) {
        paydunyaSignatureVerifier.verifier(webhook);
        PaydunyaClient.Confirmation confirmation = paydunyaClient.confirmer(webhook.token());
        paiementFinalisationService.appliquer(webhook.token(), webhook, confirmation);
    }

    @Transactional(readOnly = true)
    public List<PaiementSuperviseResponse> superviser() {
        return paiementRepository.findAllByOrderByDateCreationDesc().stream()
                .map(PaiementSuperviseResponse::depuis)
                .toList();
    }

    private String urlPaiement(Paiement paiement) {
        return paiement.getUrlPaydunya() != null ? paiement.getUrlPaydunya()
                : paydunyaClient.urlPaiement(paiement.getTokenPaydunya());
    }

}
