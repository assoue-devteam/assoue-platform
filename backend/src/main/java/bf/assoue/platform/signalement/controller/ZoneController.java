package bf.assoue.platform.signalement.controller;

import bf.assoue.platform.signalement.dto.ZoneRequest;
import bf.assoue.platform.signalement.dto.ZoneResponse;
import bf.assoue.platform.signalement.service.ZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
public class ZoneController {

    private final ZoneService zoneService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT','COLLECTEUR')")
    public ResponseEntity<Page<ZoneResponse>> listerActives(Pageable pageable) {
        return ResponseEntity.ok(zoneService.listerActives(pageable));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ZoneResponse>> listerAdmin(Pageable pageable) {
        return ResponseEntity.ok(zoneService.lister(pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ZoneResponse> creer(@Valid @RequestBody ZoneRequest request) {
        return ResponseEntity.ok(zoneService.creer(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ZoneResponse> modifier(@PathVariable Long id, @Valid @RequestBody ZoneRequest request) {
        return ResponseEntity.ok(zoneService.modifier(id, request));
    }

    @PutMapping("/{id}/desactiver")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> desactiver(@PathVariable Long id) {
        zoneService.desactiver(id);
        return ResponseEntity.ok().build();
    }
}