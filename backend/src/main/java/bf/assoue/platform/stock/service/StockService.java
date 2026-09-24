package bf.assoue.platform.stock.service;

import bf.assoue.platform.collecte.model.Materiau;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.dto.StockMatierePremiereResponse;
import bf.assoue.platform.stock.dto.StockProduitResponse;
import bf.assoue.platform.stock.model.StockMatierePremiere;
import bf.assoue.platform.stock.model.StockProduit;
import bf.assoue.platform.stock.repository.StockMatierePremiereRepository;
import bf.assoue.platform.stock.repository.StockProduitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockProduitRepository stockProduitRepository;
    private final StockMatierePremiereRepository stockMatierePremiereRepository;

    @Transactional
    public void creerStockInitial(Produit produit, int quantiteInitiale) {
        StockProduit stock = StockProduit.builder().produit(produit).quantite(quantiteInitiale).build();
        stockProduitRepository.save(stock);
    }

    public boolean estEnRupture(Long produitId) {
        return stockProduitRepository.findByProduitId(produitId)
                .map(stock -> stock.getQuantite() <= 0)
                .orElse(true);
    }

    @Transactional
    public void decrementerStockProduit(Long produitId, int quantite) {
        StockProduit stock = stockProduitRepository.findByProduitId(produitId)
                .orElseThrow(() -> new RessourceIntrouvableException("Aucun stock trouvé pour le produit " + produitId));

        if (stock.getQuantite() < quantite) {
            throw new RequeteInvalideException("Stock insuffisant pour le produit " + produitId);
        }

        stock.setQuantite(stock.getQuantite() - quantite);
        stockProduitRepository.save(stock);
    }

    @Transactional(readOnly = true)
    public List<StockProduitResponse> listerStocksProduits() {
        return stockProduitRepository.findAll().stream()
                .map(StockProduitResponse::depuis)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StockMatierePremiereResponse> listerStocksMatieresPremieres() {
        return stockMatierePremiereRepository.findAll().stream()
                .map(StockMatierePremiereResponse::depuis)
                .toList();
    }

    @Transactional
    public StockProduitResponse ajusterStockProduit(Long produitId, int quantite) {
        StockProduit stock = stockProduitRepository.findByProduitId(produitId)
                .orElseThrow(() -> new RessourceIntrouvableException("Aucun stock trouvé pour le produit " + produitId));

        stock.setQuantite(quantite);
        return StockProduitResponse.depuis(stockProduitRepository.save(stock));
    }

    @Transactional
    public void incrementerStockMatierePremiere(Materiau materiau, BigDecimal quantite) {
        StockMatierePremiere stock = stockMatierePremiereRepository.findByMateriauId(materiau.getId())
                .orElseGet(() -> StockMatierePremiere.builder().materiau(materiau).quantite(BigDecimal.ZERO).build());

        stock.setQuantite(stock.getQuantite().add(quantite));
        stockMatierePremiereRepository.save(stock);
    }

}
