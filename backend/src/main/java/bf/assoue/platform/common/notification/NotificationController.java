package bf.assoue.platform.common.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<Notification>> lister(
            @RequestParam(defaultValue = "false") boolean lue,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        String destinataire = notificationService.destinataireCourant();
        return ResponseEntity.ok(notificationService.lister(destinataire, lue, page, taille));
    }

    @GetMapping("/non-lues")
    public ResponseEntity<Map<String, Long>> compterNonLues() {
        String destinataire = notificationService.destinataireCourant();
        return ResponseEntity.ok(Map.of("total", notificationService.compterNonLues(destinataire)));
    }

    @PutMapping("/{id}/lue")
    public ResponseEntity<Void> marquerLue(@PathVariable Long id) {
        notificationService.marquerLue(id, notificationService.destinataireCourant());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/lue-toutes")
    public ResponseEntity<Void> marquerToutesLues() {
        notificationService.marquerToutesLues(notificationService.destinataireCourant());
        return ResponseEntity.ok().build();
    }
}
