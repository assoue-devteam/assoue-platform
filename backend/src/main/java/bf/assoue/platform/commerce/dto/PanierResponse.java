package bf.assoue.platform.commerce.dto;

import java.math.BigDecimal;
import java.util.List;

public record PanierResponse(
        List<LignePanierResponse> lignes,
        BigDecimal total
) {

    public record LignePanierResponse(ProduitResponse produit, int quantite) {
    }

    public static PanierResponse depuis(List<LignePanierResponse> lignes) {
        BigDecimal total = lignes.stream()
                .map(ligne -> ligne.produit().prix().multiply(BigDecimal.valueOf(ligne.quantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PanierResponse(lignes, total);
    }

}
