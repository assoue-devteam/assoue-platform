package bf.assoue.platform.stock.dto;

import bf.assoue.platform.stock.model.StockMatierePremiere;

import java.math.BigDecimal;

public record StockMatierePremiereResponse(Long materiauId, String materiauNom, BigDecimal quantite) {

    public static StockMatierePremiereResponse depuis(StockMatierePremiere stock) {
        return new StockMatierePremiereResponse(stock.getMateriau().getId(), stock.getMateriau().getNom(), stock.getQuantite());
    }

}
