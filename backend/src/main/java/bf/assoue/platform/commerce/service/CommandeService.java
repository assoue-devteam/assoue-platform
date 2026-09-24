package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.commerce.dto.CommandeAdminResponse;
import bf.assoue.platform.commerce.dto.CommandeEnAttenteResponse;
import bf.assoue.platform.commerce.dto.CommandeRequest;
import bf.assoue.platform.commerce.dto.CommandeResponse;
import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.CommandeStatut;
import bf.assoue.platform.commerce.model.LigneCommande;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.CommandeRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommandeService {

    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StockService stockService;

    @Transactional
    public CommandeResponse creer(CommandeRequest requete, String emailClient) {
        if (requete.lignes() == null || requete.lignes().isEmpty()) {
            throw new RequeteInvalideException("Une commande doit contenir au moins une ligne");
        }

        Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable : " + emailClient));

        Commande commande = Commande.builder().client(client).build();

        requete.lignes().forEach(ligneRequete -> {
            Produit produit = produitRepository.findById(ligneRequete.produitId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Produit introuvable : " + ligneRequete.produitId()));

            if (stockService.estEnRupture(produit.getId())) {
                throw new RequeteInvalideException("Produit en rupture de stock : " + produit.getNom());
            }

            LigneCommande ligne = LigneCommande.builder()
                    .commande(commande)
                    .produit(produit)
                    .quantite(ligneRequete.quantite())
                    .prixUnitaire(produit.getPrix())
                    .build();
            commande.getLignes().add(ligne);
        });

        return CommandeResponse.depuis(commandeRepository.save(commande));
    }

    /**
     * MG-02 : le manager consulte n'importe quelle commande pour en connaître le
     * statut réel sans dépendre du webhook ; le client, lui, reste limité aux
     * siennes (404 sur celle d'un tiers, pour ne pas en révéler l'existence).
     */
    public CommandeResponse consulter(Long id, String emailAppelant, boolean estManager) {
        Commande commande = trouver(id);

        if (!estManager && !commande.getClient().getEmail().equals(emailAppelant)) {
            throw new RessourceIntrouvableException("Commande introuvable : " + id);
        }

        return CommandeResponse.depuis(commande);
    }

    /** CL-05 : le client consulte l'historique de ses propres commandes. */
    public List<CommandeResponse> listerPourClient(String emailClient) {
        return commandeRepository.findByClientEmailOrderByDateCreationDesc(emailClient).stream()
                .map(CommandeResponse::depuis)
                .toList();
    }

    /** MG-02 : suivi de l'ensemble des commandes clients, filtrable par statut. */
    public List<CommandeAdminResponse> lister(CommandeStatut statut) {
        List<Commande> commandes = statut != null
                ? commandeRepository.findByStatutOrderByDateCreationDesc(statut)
                : commandeRepository.findAllByOrderByDateCreationDesc();

        return commandes.stream().map(CommandeAdminResponse::depuis).toList();
    }

    /**
     * MG-05 : commandes restées en attente de paiement au-delà du délai, à relancer.
     * Pas de notification poussée tant que l'infra temps réel (US-04) n'existe pas —
     * le manager interroge cet endpoint.
     */
    public List<CommandeEnAttenteResponse> enAttenteDepuis(int heures) {
        LocalDateTime maintenant = LocalDateTime.now();

        return commandeRepository
                .findByStatutAndDateCreationBeforeOrderByDateCreationAsc(
                        CommandeStatut.EN_ATTENTE_PAIEMENT, maintenant.minusHours(heures))
                .stream()
                .map(commande -> CommandeEnAttenteResponse.depuis(commande, maintenant))
                .toList();
    }

    /**
     * Appelée par le module paiement une fois le paiement confirmé par PayDunya
     * (US-02) — c'est ce moment-là, pas la création de la commande, qui décrémente
     * le stock (US-05 : "vente confirmée").
     */
    @Transactional
    public void marquerPayee(Long commandeId) {
        Commande commande = trouver(commandeId);

        if (commande.getStatut() == CommandeStatut.PAYEE) {
            return;
        }

        if (commande.getStatut() != CommandeStatut.EN_ATTENTE_PAIEMENT) {
            throw new RequeteInvalideException(
                    "Impossible de marquer comme payée une commande au statut : " + commande.getStatut());
        }

        commande.getLignes().forEach(ligne ->
                stockService.decrementerStockProduit(ligne.getProduit().getId(), ligne.getQuantite()));

        commande.setStatut(CommandeStatut.PAYEE);
        commandeRepository.save(commande);
    }

    private Commande trouver(Long id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Commande introuvable : " + id));
    }

}
