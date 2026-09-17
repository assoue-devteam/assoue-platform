package bf.assoue.platform.stock.controller;

import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.dto.AjustementStockRequest;
import bf.assoue.platform.stock.dto.StockMatierePremiereResponse;
import bf.assoue.platform.stock.dto.StockProduitResponse;
import bf.assoue.platform.stock.repository.StockMatierePremiereRepository;
import bf.assoue.platform.stock.repository.StockProduitRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StockController {

    private final StockProduitRepository stockProduitRepository;
    private final StockMatierePremiereRepository stockMatierePremiereRepository;

    @GetMapping("/produits")
    public List<StockProduitResponse> listerStocksProduits() {
        return stockProduitRepository.findAll().stream().map(StockProduitResponse::depuis).toList();
    }

    @GetMapping("/matieres-premieres")
    public List<StockMatierePremiereResponse> listerStocksMatieresPremieres() {
        return stockMatierePremiereRepository.findAll().stream().map(StockMatierePremiereResponse::depuis).toList();
    }

    @PutMapping("/produits/{produitId}")
    public StockProduitResponse ajusterStockProduit(@PathVariable Long produitId, @Valid @RequestBody AjustementStockRequest requete) {
        var stock = stockProduitRepository.findByProduitId(produitId)
                .orElseThrow(() -> new RessourceIntrouvableException("Aucun stock trouvé pour le produit " + produitId));
        stock.setQuantite(requete.quantite());
        return StockProduitResponse.depuis(stockProduitRepository.save(stock));
    }

}
