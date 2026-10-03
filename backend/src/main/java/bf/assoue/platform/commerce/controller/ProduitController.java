package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.dto.VedetteRequest;
import bf.assoue.platform.commerce.service.ProduitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @PutMapping("/{id}/vedette")
    @PreAuthorize("hasRole('ADMIN')")
    public ProduitResponse definirVedette(@PathVariable Long id, @Valid @RequestBody VedetteRequest requete) {
        return produitService.definirVedette(id, requete.vedette());
    }

}
