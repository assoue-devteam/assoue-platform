package bf.assoue.platform.communaute.dto;

import bf.assoue.platform.communaute.model.ChiffreCommunaute;

public record ChiffreResponse(String libelle, int valeur) {

    public static ChiffreResponse depuis(ChiffreCommunaute chiffre) {
        return new ChiffreResponse(chiffre.getLibelle(), chiffre.getValeur());
    }

}
