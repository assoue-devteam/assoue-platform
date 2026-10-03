package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.service.FavoriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/favoris")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
public class FavoriController {

    private final FavoriService favoriService;

    @GetMapping
    public List<ProduitResponse> lister(Principal principal) {
        return favoriService.lister(principal.getName());
    }

    @PutMapping("/{produitId}")
    public ResponseEntity<Void> ajouter(@PathVariable Long produitId, Principal principal) {
        favoriService.ajouter(produitId, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{produitId}")
    public ResponseEntity<Void> retirer(@PathVariable Long produitId, Principal principal) {
        favoriService.retirer(produitId, principal.getName());
        return ResponseEntity.noContent().build();
    }

}
