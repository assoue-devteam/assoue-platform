package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.CommandeEnAttenteResponse;
import bf.assoue.platform.commerce.dto.CommandeRequest;
import bf.assoue.platform.commerce.dto.CommandeResponse;
import bf.assoue.platform.commerce.service.CommandeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
public class CommandeController {

    private final CommandeService commandeService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<CommandeResponse> creer(@Valid @RequestBody CommandeRequest requete, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commandeService.creer(requete, principal.getName()));
    }

    @GetMapping("/en-attente")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CommandeEnAttenteResponse> enAttente(@RequestParam(defaultValue = "24") int heures) {
        return commandeService.enAttenteDepuis(heures);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public CommandeResponse consulter(@PathVariable Long id, Principal principal) {
        return commandeService.consulter(id, principal.getName());
    }

}
