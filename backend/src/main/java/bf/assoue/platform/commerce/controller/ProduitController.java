package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.ProduitRequest;
import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.dto.VedetteRequest;
import bf.assoue.platform.commerce.service.ProduitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
public class ProduitController {

    private final ProduitService produitService;

    @GetMapping
    public List<ProduitResponse> lister(@RequestParam(required = false) Long categorieId) {
        return produitService.lister(categorieId);
    }

    @GetMapping("/{id}")
    public ProduitResponse consulter(@PathVariable Long id) {
        return produitService.consulter(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProduitResponse> creer(@Valid @RequestBody ProduitRequest requete) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produitService.creer(requete));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProduitResponse modifier(@PathVariable Long id, @Valid @RequestBody ProduitRequest requete) {
        return produitService.modifier(id, requete);
    }

    /** Suppression logique (archivage) : le produit disparaît du catalogue, pas de l'historique. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        produitService.archiver(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/vedette")
    @PreAuthorize("hasRole('ADMIN')")
    public ProduitResponse definirVedette(@PathVariable Long id, @Valid @RequestBody VedetteRequest requete) {
        return produitService.definirVedette(id, requete.vedette());
    }

}
