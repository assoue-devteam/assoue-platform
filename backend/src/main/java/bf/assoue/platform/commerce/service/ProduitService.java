package bf.assoue.platform.commerce.service;

import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.AvisRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final StockService stockService;
    private final AvisRepository avisRepository;

    public List<ProduitResponse> lister(Long categorieId) {
        List<Produit> produits = categorieId != null
                ? produitRepository.findByCategorieId(categorieId)
                : produitRepository.findAll();

        return produits.stream().map(this::versReponse).toList();
    }

    public ProduitResponse consulter(Long id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Produit introuvable : " + id));
        return versReponse(produit);
    }

    @Transactional
    public ProduitResponse definirVedette(Long id, boolean vedette) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Produit introuvable : " + id));
        produit.setVedette(vedette);
        return versReponse(produitRepository.save(produit));
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
