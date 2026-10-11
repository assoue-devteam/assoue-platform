package bf.assoue.platform.signalement.controller;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.signalement.dto.CreerSignalementRequest;
import bf.assoue.platform.signalement.dto.SignalementResponse;
import bf.assoue.platform.signalement.dto.ValiderSignalementRequest;
import bf.assoue.platform.signalement.service.SignalementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
public class SignalementController {

    private final SignalementService signalementService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<SignalementResponse> creer(
            @ModelAttribute CreerSignalementRequest request,
            @RequestParam("photos") List<MultipartFile> photos,
            @AuthenticationPrincipal Utilisateur client) {
        return ResponseEntity.ok(signalementService.creer(request, client.getEmail(), photos));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<Page<SignalementResponse>> mesSignalements(
            @AuthenticationPrincipal Utilisateur client, Pageable pageable) {
        return ResponseEntity.ok(signalementService.mesSignalements(client, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<SignalementResponse> consulter(
            @PathVariable Long id, @AuthenticationPrincipal Utilisateur client) {
        return ResponseEntity.ok(signalementService.consulter(id, client));
    }

    @PutMapping("/{id}/valider")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SignalementResponse> valider(
            @PathVariable Long id, @Valid @RequestBody ValiderSignalementRequest request,
            @AuthenticationPrincipal Utilisateur admin) {
        return ResponseEntity.ok(signalementService.valider(id, request, admin.getEmail()));
    }
}