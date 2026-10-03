package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.commerce.dto.AvisRequest;
import bf.assoue.platform.commerce.dto.AvisResponse;
import bf.assoue.platform.commerce.model.Avis;
import bf.assoue.platform.commerce.model.CommandeStatut;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.AvisRepository;
import bf.assoue.platform.commerce.repository.CommandeRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AvisService {

    // Un avis n'a de valeur que si l'achat a été payé : une commande en attente ou annulée ne compte pas.
    static final Set<CommandeStatut> STATUTS_ACHAT = EnumSet.of(
            CommandeStatut.PAYEE, CommandeStatut.EN_PREPARATION, CommandeStatut.EXPEDIEE, CommandeStatut.LIVREE);

    private final AvisRepository avisRepository;
    private final ProduitRepository produitRepository;
    private final CommandeRepository commandeRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public AvisResponse.Liste lister(Long produitId) {
        verifierProduit(produitId);
        return new AvisResponse.Liste(
                avisRepository.noteMoyenne(produitId),
                avisRepository.countByProduitId(produitId),
                avisRepository.findByProduitIdOrderByDateCreationDesc(produitId).stream().map(AvisResponse::depuis).toList());
    }

    @Transactional(readOnly = true)
    public AvisResponse.Mien mien(Long produitId, String emailClient) {
        verifierProduit(produitId);
        return new AvisResponse.Mien(
                commandeRepository.aAchete(emailClient, produitId, STATUTS_ACHAT),
                avisRepository.findByClientEmailAndProduitId(emailClient, produitId).map(AvisResponse::depuis).orElse(null));
    }

    /** Crée l'avis du client ou remplace le précédent : un seul avis par client et par produit. */
    @Transactional
    public AvisResponse donner(Long produitId, AvisRequest requete, String emailClient) {
        Produit produit = verifierProduit(produitId);
        if (!commandeRepository.aAchete(emailClient, produitId, STATUTS_ACHAT)) {
            throw new RequeteInvalideException("Vous pourrez donner votre avis après avoir acheté et payé ce produit.");
        }
        Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable : " + emailClient));

        Avis avis = avisRepository.findByClientEmailAndProduitId(emailClient, produitId)
                .orElseGet(() -> Avis.builder().client(client).produit(produit).build());
        avis.setNote(requete.note().shortValue());
        String commentaire = requete.commentaire() == null ? null : requete.commentaire().trim();
        avis.setCommentaire(commentaire == null || commentaire.isEmpty() ? null : commentaire);
        return AvisResponse.depuis(avisRepository.save(avis));
    }

    private Produit verifierProduit(Long produitId) {
        return produitRepository.findById(produitId)
                .orElseThrow(() -> new RessourceIntrouvableException("Produit introuvable : " + produitId));
    }

}
