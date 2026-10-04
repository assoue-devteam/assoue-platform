package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.PanierRequest;
import bf.assoue.platform.commerce.dto.PanierResponse;
import bf.assoue.platform.commerce.service.PanierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/panier")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
public class PanierController {

    private final PanierService panierService;

    @GetMapping
    public PanierResponse consulter(Principal principal) {
        return panierService.consulter(principal.getName());
    }

    @PutMapping
    public PanierResponse remplacer(@Valid @RequestBody PanierRequest requete, Principal principal) {
        return panierService.remplacer(requete, principal.getName());
    }

}
