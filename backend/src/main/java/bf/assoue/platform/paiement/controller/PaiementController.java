package bf.assoue.platform.paiement.controller;

import bf.assoue.platform.paiement.dto.PaiementResponse;
import bf.assoue.platform.paiement.service.PaiementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
public class PaiementController {

    private final PaiementService paiementService;

    @PostMapping("/commandes/{commandeId}")
    public PaiementResponse initier(@PathVariable Long commandeId, HttpServletRequest request) {
        String callbackUrl = request.getRequestURL().toString().replace(
                "/api/paiements/commandes/" + commandeId, "/api/paiements/webhook");
        return paiementService.initier(commandeId, callbackUrl);
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody Map<String, Object> payload) {
        paiementService.traiterWebhook(payload);
        return ResponseEntity.ok().build();
    }

}
