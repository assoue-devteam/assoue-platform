package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.CommandeAdminResponse;
import bf.assoue.platform.commerce.dto.CommandeEnAttenteResponse;
import bf.assoue.platform.commerce.dto.CommandeRequest;
import bf.assoue.platform.commerce.dto.CommandeResponse;
import bf.assoue.platform.commerce.model.CommandeStatut;
import bf.assoue.platform.commerce.service.CommandeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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

    @GetMapping("/mes-commandes")
    @PreAuthorize("hasRole('CLIENT')")
    public List<CommandeResponse> mesCommandes(Principal principal) {
        return commandeService.listerPourClient(principal.getName());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<CommandeAdminResponse> lister(@RequestParam(required = false) CommandeStatut statut) {
        return commandeService.lister(statut);
    }

    @GetMapping("/en-attente")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CommandeEnAttenteResponse> enAttente(@RequestParam(defaultValue = "24") int heures) {
        return commandeService.enAttenteDepuis(heures);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','ADMIN')")
    public CommandeResponse consulter(@PathVariable Long id, Authentication authentication) {
        return commandeService.consulter(id, authentication.getName(), estManager(authentication));
    }

    /** MG-02 : le manager (rôle ADMIN) n'est pas limité à ses propres commandes. */
    private boolean estManager(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

}
