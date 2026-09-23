package bf.assoue.platform.auth.controller;

import bf.assoue.platform.auth.dto.CreationUtilisateurRequest;
import bf.assoue.platform.auth.dto.MajRolesRequest;
import bf.assoue.platform.auth.dto.UtilisateurResponse;
import bf.assoue.platform.auth.service.UtilisateurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    public List<UtilisateurResponse> lister() {
        return utilisateurService.lister();
    }

    @PostMapping
    public ResponseEntity<UtilisateurResponse> creer(@Valid @RequestBody CreationUtilisateurRequest requete) {
        return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurService.creer(requete));
    }

    @PutMapping("/{id}/roles")
    public UtilisateurResponse remplacerRoles(@PathVariable Long id, @Valid @RequestBody MajRolesRequest requete) {
        return utilisateurService.remplacerRoles(id, requete);
    }

}
