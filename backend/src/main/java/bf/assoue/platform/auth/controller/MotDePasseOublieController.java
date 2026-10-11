package bf.assoue.platform.auth.controller;

import bf.assoue.platform.auth.dto.DemandeMotDePasseOublieRequest;
import bf.assoue.platform.auth.dto.ReinitialisationMotDePasseRequest;
import bf.assoue.platform.auth.dto.ReponseMotDePasseOublie;
import bf.assoue.platform.auth.dto.VerificationCodeRequest;
import bf.assoue.platform.auth.service.MotDePasseOublieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/mot-de-passe-oublie")
@RequiredArgsConstructor
public class MotDePasseOublieController {

    private final MotDePasseOublieService motDePasseOublieService;

    @PostMapping("/demande")
    public ResponseEntity<ReponseMotDePasseOublie> demanderCode(
            @Valid @RequestBody DemandeMotDePasseOublieRequest request,
            HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        return ResponseEntity.ok(motDePasseOublieService.demanderCode(request.email(), ip));
    }

    @PostMapping("/verification")
    public ResponseEntity<Map<String, String>> verifierCode(
            @Valid @RequestBody VerificationCodeRequest request) {
        String jeton = motDePasseOublieService.verifierCode(request.email(), request.code());
        return ResponseEntity.ok(Map.of("jeton", jeton));
    }

    @PostMapping("/reinitialisation")
    public ResponseEntity<Void> reinitialiser(
            @Valid @RequestBody ReinitialisationMotDePasseRequest request) {
        motDePasseOublieService.reinitialiser(request.jeton(), request.nouveauMotDePasse());
        return ResponseEntity.ok().build();
    }
}
