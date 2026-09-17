package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.service.ProduitService;
import lombok.RequiredArgsConstructor;
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

}
