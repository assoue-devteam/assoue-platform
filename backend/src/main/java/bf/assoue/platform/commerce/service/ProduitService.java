package bf.assoue.platform.commerce.service;

import bf.assoue.platform.commerce.dto.ProduitRequest;
import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.AvisRepository;
import bf.assoue.platform.commerce.repository.CategorieRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final CategorieRepository categorieRepository;
    private final StockService stockService;
    private final AvisRepository avisRepository;

    public List<ProduitResponse> lister(Long categorieId) {
        List<Produit> produits = categorieId != null
                ? produitRepository.findByCategorieIdAndArchiveFalse(categorieId)
                : produitRepository.findByArchiveFalse();

        return produits.stream().map(this::versReponse).toList();
    }

    public ProduitResponse consulter(Long id) {
        return versReponse(produitVisible(id));
    }

    /** Un produit archivé est introuvable partout côté public (ne révèle pas son existence). */
    private Produit produitVisible(Long id) {
        return produitRepository.findByIdAndArchiveFalse(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Produit introuvable : " + id));
    }

    @Transactional
    public ProduitResponse definirVedette(Long id, boolean vedette) {
        Produit produit = produitVisible(id);
        produit.setVedette(vedette);
        return versReponse(produitRepository.save(produit));
    }

    /** Admin : crée le produit avec son stock initial (absent = 0, donc en rupture). */
    @Transactional
    public ProduitResponse creer(ProduitRequest requete) {
        Categorie categorie = categorieRepository.findById(requete.categorieId())
                .orElseThrow(() -> new RessourceIntrouvableException("Catégorie introuvable : " + requete.categorieId()));

        Produit produit = produitRepository.save(Produit.builder()
                .nom(requete.nom().trim())
                .description(requete.description())
                .prix(BigDecimal.valueOf(requete.prix()))
                .imageUrl(requete.imageUrl())
                .categorie(categorie)
                .vedette(Boolean.TRUE.equals(requete.vedette()))
                .build());

        stockService.creerStockInitial(produit, requete.stockQuantite() != null ? requete.stockQuantite() : 0);
        return versReponse(produit);
    }

    /** Admin : met à jour le produit ; stockQuantite présent remplace le stock (absent = inchangé). */
    @Transactional
    public ProduitResponse modifier(Long id, ProduitRequest requete) {
        Produit produit = produitVisible(id);
        Categorie categorie = categorieRepository.findById(requete.categorieId())
                .orElseThrow(() -> new RessourceIntrouvableException("Catégorie introuvable : " + requete.categorieId()));

        produit.setNom(requete.nom().trim());
        produit.setDescription(requete.description());
        produit.setPrix(BigDecimal.valueOf(requete.prix()));
        produit.setImageUrl(requete.imageUrl());
        produit.setCategorie(categorie);
        produit.setVedette(Boolean.TRUE.equals(requete.vedette()));
        if (requete.stockQuantite() != null) {
            stockService.ajusterStockProduit(id, requete.stockQuantite());
        }
        return versReponse(produitRepository.save(produit));
    }

    /**
     * Admin : suppression toujours logique (jamais de 409, jamais de DELETE physique) —
     * un produit déjà vendu doit rester lisible dans l'historique des commandes, et les
     * favoris/paniers qui le référencent ne cassent pas. Le panier et la commande en
     * cours refusent ensuite tout produit archivé, comme un produit en rupture.
     */
    @Transactional
    public void archiver(Long id) {
        Produit produit = produitVisible(id);
        produit.setArchive(true);
        produitRepository.save(produit);
    }

    ProduitResponse versReponse(Produit produit) {
        boolean enRupture = stockService.estEnRupture(produit.getId());
        return new ProduitResponse(
                produit.getId(),
                produit.getNom(),
                produit.getDescription(),
                produit.getPrix(),
                produit.getImageUrl(),
                produit.getCategorie().getNom(),
                enRupture,
                produit.isVedette(),
                avisRepository.noteMoyenne(produit.getId()),
                avisRepository.countByProduitId(produit.getId())
        );
    }

}
