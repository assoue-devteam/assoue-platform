package bf.assoue.platform.stock.dto;

import bf.assoue.platform.stock.model.StockProduit;

public record StockProduitResponse(Long produitId, String produitNom, int quantite) {

    public static StockProduitResponse depuis(StockProduit stock) {
        return new StockProduitResponse(stock.getProduit().getId(), stock.getProduit().getNom(), stock.getQuantite());
    }

}
