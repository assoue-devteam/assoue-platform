package bf.assoue.platform.collecte.dto;

import bf.assoue.platform.collecte.model.Materiau;

public record MateriauResponse(Long id, String nom, String unite) {

    public static MateriauResponse depuis(Materiau materiau) {
        return new MateriauResponse(materiau.getId(), materiau.getNom(), materiau.getUnite());
    }
}
