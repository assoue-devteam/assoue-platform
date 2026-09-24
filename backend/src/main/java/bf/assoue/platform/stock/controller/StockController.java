package bf.assoue.platform.stock.controller;

import bf.assoue.platform.stock.dto.AjustementStockRequest;
import bf.assoue.platform.stock.dto.StockMatierePremiereResponse;
import bf.assoue.platform.stock.dto.StockProduitResponse;
import bf.assoue.platform.stock.service.StockService;
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

    private final StockService stockService;

    @GetMapping("/produits")
    public List<StockProduitResponse> listerStocksProduits() {
        return stockService.listerStocksProduits();
    }

    @GetMapping("/matieres-premieres")
    public List<StockMatierePremiereResponse> listerStocksMatieresPremieres() {
        return stockService.listerStocksMatieresPremieres();
    }

    @PutMapping("/produits/{produitId}")
    public StockProduitResponse ajusterStockProduit(@PathVariable Long produitId, @Valid @RequestBody AjustementStockRequest requete) {
        return stockService.ajusterStockProduit(produitId, requete.quantite());
    }

}
