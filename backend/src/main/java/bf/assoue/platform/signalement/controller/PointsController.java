package bf.assoue.platform.signalement.controller;

import bf.assoue.platform.signalement.dto.MouvementPointsResponse;
import bf.assoue.platform.signalement.dto.PointsResponse;
import bf.assoue.platform.signalement.service.PointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointsController {

    private final PointsService pointsService;

    @GetMapping("/solde")
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<PointsResponse.SoldePointsResponse> solde(Principal principal) {
        return ResponseEntity.ok(pointsService.solde(principal.getName()));
    }

    @GetMapping("/mouvements")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Page<MouvementPointsResponse>> mouvements(Principal principal, Pageable pageable) {
        return ResponseEntity.ok(pointsService.mouvements(principal.getName(), pageable));
    }

    @PostMapping("/utiliser")
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<Map<String, Integer>> utiliser(
            Principal principal,
            @RequestParam int points,
            @RequestParam Long commandeId) {
        int utilises = pointsService.utiliserPourCommande(principal.getName(), points, commandeId);
        return ResponseEntity.ok(Map.of("pointsUtilises", utilises));
    }
}