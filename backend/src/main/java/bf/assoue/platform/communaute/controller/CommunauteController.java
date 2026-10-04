package bf.assoue.platform.communaute.controller;

import bf.assoue.platform.communaute.dto.ChiffreResponse;
import bf.assoue.platform.communaute.dto.ChiffresRequest;
import bf.assoue.platform.communaute.dto.EvenementRequest;
import bf.assoue.platform.communaute.dto.EvenementResponse;
import bf.assoue.platform.communaute.service.CommunauteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Lecture publique (voir SecurityConfig), écriture réservée à l'ADMIN. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommunauteController {

    private final CommunauteService communauteService;

    @GetMapping("/evenements")
    public List<EvenementResponse> evenements() {
        return communauteService.evenements();
    }

    @PostMapping("/evenements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EvenementResponse> creer(@Valid @RequestBody EvenementRequest requete) {
        return ResponseEntity.status(HttpStatus.CREATED).body(communauteService.creer(requete));
    }

    @PutMapping("/evenements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EvenementResponse modifier(@PathVariable Long id, @Valid @RequestBody EvenementRequest requete) {
        return communauteService.modifier(id, requete);
    }

    @DeleteMapping("/evenements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        communauteService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/communaute/chiffres")
    public List<ChiffreResponse> chiffres() {
        return communauteService.chiffres();
    }

    @PutMapping("/communaute/chiffres")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ChiffreResponse> remplacerChiffres(@Valid @RequestBody ChiffresRequest requete) {
        return communauteService.remplacerChiffres(requete);
    }

}
