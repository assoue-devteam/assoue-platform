package bf.assoue.platform.commerce.service;

import bf.assoue.platform.commerce.dto.ProduitRequest;
import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.AvisRepository;
import bf.assoue.platform.commerce.repository.CategorieRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.images.ImageService;
import bf.assoue.platform.images.SuppressionImageApresCommit;
import bf.assoue.platform.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final CategorieRepository categorieRepository;
    private final StockService stockService;
    private final AvisRepository avisRepository;
    private final ImageService imageService;
    private final SuppressionImageApresCommit nettoyageImage;

    @Transactional(readOnly = true)
    public List<ProduitResponse> lister(Long categorieId) {
        List<Produit> produits = categorieId != null
                ? produitRepository.findByCategorieIdAndArchiveFalse(categorieId)
                : produitRepository.findByArchiveFalse();

        return versReponses(produits);
    }

    @Transactional(readOnly = true)
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

        // imageCle l'emporte sur imageUrl (documenté sur le DTO).
        String cle = imageService.validerCleExistante(requete.imageCle());
        Produit produit = produitRepository.save(Produit.builder()
                .nom(requete.nom().trim())
                .description(requete.description())
                .prix(BigDecimal.valueOf(requete.prix()))
                .imageUrl(cle != null ? null : requete.imageUrl())
                .imageCle(cle)
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
        // imageCle l'emporte ; l'ancien fichier est supprimé après commit s'il n'est plus référencé.
        // Les lignes de commande, paniers et favoris pointent le produit vivant : aucun historique
        // ne stocke de copie d'image, la suppression est donc sans risque. L'archivage garde son fichier.
        String ancienneCle = produit.getImageCle();
        if (requete.imageCle() != null) {
            String cle = imageService.validerCleExistante(requete.imageCle());
            produit.setImageCle(cle);
            produit.setImageUrl(null);
        } else {
            produit.setImageUrl(requete.imageUrl());
            produit.setImageCle(null);
        }
        if (ancienneCle != null && !ancienneCle.equals(produit.getImageCle())) {
            nettoyageImage.supprimer(ancienneCle);
        }
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
                resoudreImage(produit.getImageUrl(), produit.getImageCle()),
                produit.getImageCle(),
                produit.getCategorie().getNom(),
                enRupture,
                produit.isVedette(),
                avisRepository.noteMoyenne(produit.getId()),
                avisRepository.countByProduitId(produit.getId())
        );
    }

    /**
     * Version listes : ruptures et avis chargés en masse (2 requêtes pour N
     * produits au lieu de 3N), catégories déjà jointes par l'EntityGraph.
     */
    List<ProduitResponse> versReponses(List<Produit> produits) {
        List<Long> ids = produits.stream().map(Produit::getId).toList();
        Map<Long, Boolean> ruptures = stockService.rupturesParProduit(ids);
        Map<Long, AvisRepository.AvisStat> stats = ids.isEmpty() ? Map.of()
                : avisRepository.statsParProduit(ids).stream()
                        .collect(Collectors.toMap(AvisRepository.AvisStat::getProduitId, stat -> stat));
        return produits.stream()
                .map(produit -> {
                    AvisRepository.AvisStat stat = stats.get(produit.getId());
                    return new ProduitResponse(
                            produit.getId(),
                            produit.getNom(),
                            produit.getDescription(),
                            produit.getPrix(),
                            resoudreImage(produit.getImageUrl(), produit.getImageCle()),
                            produit.getImageCle(),
                            produit.getCategorie().getNom(),
                            ruptures.getOrDefault(produit.getId(), true),
                            produit.isVedette(),
                            stat != null ? stat.getMoyenne() : null,
                            stat != null ? stat.getNombre() : 0L);
                })
                .toList();
    }

    /** URL legacy telle quelle, sinon chemin d'image uploadée, sinon rien. */
    static String resoudreImage(String imageUrl, String imageCle) {
        if (imageUrl != null) {
            return imageUrl;
        }
        if (imageCle != null) {
            return ImageService.CHEMIN_PUBLIC + imageCle;
        }
        return null;
    }

}
