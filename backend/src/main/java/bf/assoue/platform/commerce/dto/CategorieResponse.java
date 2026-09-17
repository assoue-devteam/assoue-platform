package bf.assoue.platform.commerce.dto;

import bf.assoue.platform.commerce.model.Categorie;

public record CategorieResponse(Long id, String nom, String description) {

    public static CategorieResponse depuis(Categorie categorie) {
        return new CategorieResponse(categorie.getId(), categorie.getNom(), categorie.getDescription());
    }

}
