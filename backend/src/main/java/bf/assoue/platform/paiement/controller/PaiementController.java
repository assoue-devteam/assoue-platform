package bf.assoue.platform.paiement.controller;

import bf.assoue.platform.paiement.dto.PaiementResponse;
import bf.assoue.platform.paiement.dto.PaiementSuperviseResponse;
import bf.assoue.platform.paiement.service.PaiementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
public class PaiementController {

    private final PaiementService paiementService;

    @PostMapping("/commandes/{commandeId}")
    @PreAuthorize("hasRole('CLIENT')")
    public PaiementResponse initier(@PathVariable Long commandeId, Principal principal) {
        return paiementService.initier(commandeId, principal.getName());
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody Map<String, Object> payload) {
        paiementService.traiterWebhook(payload);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<PaiementSuperviseResponse> superviser() {
        return paiementService.superviser();
    }

}
