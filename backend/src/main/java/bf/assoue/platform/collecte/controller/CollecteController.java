package bf.assoue.platform.collecte.controller;

import bf.assoue.platform.collecte.dto.CollecteResponse;
import bf.assoue.platform.collecte.dto.DeclarationCollecteRequest;
import bf.assoue.platform.collecte.service.CollecteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/collectes")
@RequiredArgsConstructor
public class CollecteController {

    private final CollecteService collecteService;

    @PostMapping
    @PreAuthorize("hasRole('COLLECTEUR')")
    public ResponseEntity<CollecteResponse> declarer(@Valid @RequestBody DeclarationCollecteRequest requete, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(collecteService.declarer(requete, principal.getName()));
    }

    @GetMapping("/mes-collectes")
    @PreAuthorize("hasRole('COLLECTEUR')")
    public List<CollecteResponse> mesCollectes(Principal principal) {
        return collecteService.mesCollectes(principal.getName());
    }

    @PutMapping("/{id}/valider")
    @PreAuthorize("hasRole('ADMIN')")
    public CollecteResponse valider(@PathVariable Long id) {
        return collecteService.valider(id);
    }

    @PutMapping("/{id}/traiter")
    @PreAuthorize("hasRole('ADMIN')")
    public CollecteResponse traiter(@PathVariable Long id) {
        return collecteService.traiter(id);
    }

}
