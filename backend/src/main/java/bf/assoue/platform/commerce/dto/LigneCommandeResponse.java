package bf.assoue.platform.commerce.dto;

import bf.assoue.platform.commerce.model.LigneCommande;

import java.math.BigDecimal;

public record LigneCommandeResponse(Long produitId, String produitNom, int quantite, BigDecimal prixUnitaire) {

    public static LigneCommandeResponse depuis(LigneCommande ligne) {
        return new LigneCommandeResponse(
                ligne.getProduit().getId(),
                ligne.getProduit().getNom(),
                ligne.getQuantite(),
                ligne.getPrixUnitaire()
        );
    }

}
