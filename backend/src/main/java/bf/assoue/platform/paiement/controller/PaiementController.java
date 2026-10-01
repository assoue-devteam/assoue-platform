package bf.assoue.platform.paiement.controller;

import bf.assoue.platform.paiement.dto.PaiementResponse;
import bf.assoue.platform.paiement.dto.PaiementSuperviseResponse;
import bf.assoue.platform.paiement.dto.PaydunyaWebhook;
import bf.assoue.platform.paiement.service.PaiementService;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
public class PaiementController {

    private final PaiementService paiementService;
    private final ObjectMapper objectMapper;

    @PostMapping("/commandes/{commandeId}")
    @PreAuthorize("hasRole('CLIENT')")
    public PaiementResponse initier(@PathVariable Long commandeId, Principal principal) {
        return paiementService.initier(commandeId, principal.getName());
    }

    @PostMapping(value = "/webhook", consumes = "application/x-www-form-urlencoded")
    public ResponseEntity<Void> webhook(@RequestParam("data") String data) {
        try {
            paiementService.traiterWebhook(objectMapper.readValue(data, PaydunyaWebhook.class));
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new RequeteInvalideException("Webhook PayDunya invalide");
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<PaiementSuperviseResponse> superviser() {
        return paiementService.superviser();
    }

}
