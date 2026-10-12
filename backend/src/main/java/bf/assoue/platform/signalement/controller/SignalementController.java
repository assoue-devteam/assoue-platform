package bf.assoue.platform.signalement.controller;

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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
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
            Principal principal) {
        return ResponseEntity.ok(signalementService.creer(request, principal.getName(), photos));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<Page<SignalementResponse>> mesSignalements(
            Principal principal, Pageable pageable) {
        return ResponseEntity.ok(signalementService.mesSignalements(principal.getName(), pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<SignalementResponse> consulter(
            @PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(signalementService.consulter(id, principal.getName()));
    }

    @PutMapping("/{id}/valider")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SignalementResponse> valider(
            @PathVariable Long id, @Valid @RequestBody ValiderSignalementRequest request,
            Principal principal) {
        return ResponseEntity.ok(signalementService.valider(id, request, principal.getName()));
    }
}