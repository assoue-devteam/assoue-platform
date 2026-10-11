package bf.assoue.platform.signalement.controller;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.signalement.dto.MouvementPointsResponse;
import bf.assoue.platform.signalement.dto.PointsResponse;
import bf.assoue.platform.signalement.service.PointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointsController {

    private final PointsService pointsService;

    @GetMapping("/solde")
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<PointsResponse.SoldePointsResponse> solde(@AuthenticationPrincipal Utilisateur client) {
        return ResponseEntity.ok(pointsService.solde(client.getEmail()));
    }

    @GetMapping("/mouvements")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Page<MouvementPointsResponse>> mouvements(@AuthenticationPrincipal Utilisateur client, Pageable pageable) {
        return ResponseEntity.ok(pointsService.mouvements(client.getEmail(), pageable));
    }

    @PostMapping("/utiliser")
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<Map<String, Integer>> utiliser(
            @AuthenticationPrincipal Utilisateur client,
            @RequestParam int points,
            @RequestParam Long commandeId) {
        int utilises = pointsService.utiliserPourCommande(client.getEmail(), points, commandeId);
        return ResponseEntity.ok(Map.of("pointsUtilises", utilises));
    }
}