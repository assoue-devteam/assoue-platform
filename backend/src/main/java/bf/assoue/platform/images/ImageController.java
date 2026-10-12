package bf.assoue.platform.images;

import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

/**
 * Envoi réservé à l'ADMIN (même rôle que produits et événements), lecture
 * publique (catalogue vitrine). La clé ne contient ni chemin ni nom client.
 */
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UploadImageResponse> envoyer(@RequestParam("fichier") MultipartFile fichier) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new UploadImageResponse(imageService.enregistrer(fichier)));
    }

    /**
     * Clé validée par regex stricte dès le mapping (sinon 404) : {@code ../},
     * séparateurs encodés et clés inconnues ne résolvent jamais un fichier.
     * Content-Type fixé par le serveur, cache long (clé unique et immuable).
     */
    @GetMapping("/{cle:" + CleImage.REGEX + "}")
    public ResponseEntity<byte[]> servir(@PathVariable String cle) {
        FichierImage image = imageService.lire(cle);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(image.contenu());
    }
}
