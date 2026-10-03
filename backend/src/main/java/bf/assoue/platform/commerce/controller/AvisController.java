package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.AvisRequest;
import bf.assoue.platform.commerce.dto.AvisResponse;
import bf.assoue.platform.commerce.service.AvisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/produits/{produitId}/avis")
@RequiredArgsConstructor
public class AvisController {

    private final AvisService avisService;

    @GetMapping
    public AvisResponse.Liste lister(@PathVariable Long produitId) {
        return avisService.lister(produitId);
    }

    // Sous GET /api/produits/** (public) : c'est @PreAuthorize qui exige un client connecté.
    @GetMapping("/moi")
    @PreAuthorize("hasRole('CLIENT')")
    public AvisResponse.Mien mien(@PathVariable Long produitId, Principal principal) {
        return avisService.mien(produitId, principal.getName());
    }

    @PutMapping
    @PreAuthorize("hasRole('CLIENT')")
    public AvisResponse donner(@PathVariable Long produitId, @Valid @RequestBody AvisRequest requete, Principal principal) {
        return avisService.donner(produitId, requete, principal.getName());
    }

}
