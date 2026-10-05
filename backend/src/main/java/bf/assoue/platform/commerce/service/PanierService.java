package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.commerce.dto.LigneCommandeRequest;
import bf.assoue.platform.commerce.dto.PanierRequest;
import bf.assoue.platform.commerce.dto.PanierResponse;
import bf.assoue.platform.commerce.model.LignePanier;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.LignePanierRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PanierService {

    private final LignePanierRepository lignePanierRepository;
    private final ProduitRepository produitRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StockService stockService;
    private final ProduitService produitService;

    @Transactional(readOnly = true)
    public PanierResponse consulter(String emailClient) {
        return versReponse(lignePanierRepository.findByClientEmailOrderByIdAsc(emailClient));
    }

    /**
     * Remplace tout le panier : le frontend renvoie son contenu complet, ce qui rend
     * l'appel rejouable sans risque après une coupure réseau. Le stock est vérifié dès
     * ici, mais rien n'est réservé avant la commande.
     */
    @Transactional
    public PanierResponse remplacer(PanierRequest requete, String emailClient) {
        Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable : " + emailClient));

        Map<Long, Integer> quantitesParProduit = requete.lignes().stream()
                .collect(Collectors.groupingBy(LigneCommandeRequest::produitId, LinkedHashMap::new,
                        Collectors.summingInt(LigneCommandeRequest::quantite)));

        List<LignePanier> lignes = quantitesParProduit.entrySet().stream().map(ligne -> {
            Produit produit = produitRepository.findById(ligne.getKey())
                    .orElseThrow(() -> new RessourceIntrouvableException("Produit introuvable : " + ligne.getKey()));
            if (produit.isArchive()) {
                throw new RequeteInvalideException("« " + produit.getNom() + " » n'est plus disponible");
            }
            int disponible = stockService.quantiteDisponible(produit.getId());
            if (ligne.getValue() > disponible) {
                throw new RequeteInvalideException("Stock insuffisant pour « " + produit.getNom()
                        + " » : " + disponible + " disponible(s)");
            }
            return LignePanier.builder().client(client).produit(produit).quantite(ligne.getValue()).build();
        }).toList();

        lignePanierRepository.deleteByClientId(client.getId());
        // Hibernate exécute les insertions avant les suppressions : sans ce flush, la contrainte
        // d'unicité (client, produit) casserait dès qu'un produit reste dans le panier.
        lignePanierRepository.flush();
        return versReponse(lignePanierRepository.saveAll(lignes));
    }

    private PanierResponse versReponse(List<LignePanier> lignes) {
        return PanierResponse.depuis(lignes.stream()
                .map(ligne -> new PanierResponse.LignePanierResponse(
                        produitService.versReponse(ligne.getProduit()), ligne.getQuantite()))
                .toList());
    }

}
