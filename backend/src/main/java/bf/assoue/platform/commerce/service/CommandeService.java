package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
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

@Service
@RequiredArgsConstructor
public class CommandeService {

    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StockService stockService;

    @Transactional
    public CommandeResponse creer(CommandeRequest requete, String emailClient) {
        // Multiplicité 1..* Commande→LigneCommande (docs/domaine-metier.md) : @NotEmpty
        // sur la requête l'empêche déjà en amont, on ne recrée pas la vérification ici.
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

    public CommandeResponse consulter(Long id, String emailClient) {
        Commande commande = trouver(id);

        if (!commande.getClient().getEmail().equals(emailClient)) {
            throw new RessourceIntrouvableException("Commande introuvable : " + id);
        }

        return CommandeResponse.depuis(commande);
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
