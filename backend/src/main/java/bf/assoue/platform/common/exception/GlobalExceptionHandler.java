package bf.assoue.platform.common.exception;

import bf.assoue.platform.images.ImageInvalideException;
import bf.assoue.platform.images.ImageService;
import bf.assoue.platform.images.ImageTropLourdeException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.web.servlet.MultipartProperties;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.stream.Collectors;

@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MultipartProperties multipart;

    @ExceptionHandler(EmailDejaUtiliseException.class)
    public ResponseEntity<ErreurApi> gererEmailDejaUtilise(EmailDejaUtiliseException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErreurApi.de(409, ex.getMessage()));
    }

    @ExceptionHandler(IdentifiantsInvalidesException.class)
    public ResponseEntity<ErreurApi> gererIdentifiantsInvalides(IdentifiantsInvalidesException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ErreurApi.de(401, ex.getMessage()));
    }

    @ExceptionHandler(CompteBloqueException.class)
    public ResponseEntity<ErreurApi> gererCompteBloque(CompteBloqueException ex) {
        return ResponseEntity.status(HttpStatus.LOCKED).body(ErreurApi.de(423, ex.getMessage()));
    }

    @ExceptionHandler(RessourceIntrouvableException.class)
    public ResponseEntity<ErreurApi> gererRessourceIntrouvable(RessourceIntrouvableException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErreurApi.de(404, ex.getMessage()));
    }

    @ExceptionHandler(RequeteInvalideException.class)
    public ResponseEntity<ErreurApi> gererRequeteInvalide(RequeteInvalideException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErreurApi.de(400, ex.getMessage()));
    }

    @ExceptionHandler(FournisseurPaiementIndisponibleException.class)
    public ResponseEntity<ErreurApi> gererFournisseurPaiementIndisponible(FournisseurPaiementIndisponibleException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ErreurApi.de(503, ex.getMessage()));
    }

    @ExceptionHandler(PaiementDejaInitieException.class)
    public ResponseEntity<ErreurApi> gererPaiementDejaInitie(PaiementDejaInitieException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErreurApi.de(409, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErreurApi> gererValidationInvalide(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErreurApi.de(400, message));
    }

    /** Fichier au-delà de 5 Mo : rejeté par le conteneur avant le contrôleur. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErreurApi> gererFichierTropGros(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ErreurApi.de(413, "L'image dépasse " + ImageService.formaterLimite(multipart.getMaxFileSize()) + "."));
    }

    @ExceptionHandler(ImageTropLourdeException.class)
    public ResponseEntity<ErreurApi> gererImageTropLourde(ImageTropLourdeException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(ErreurApi.de(413, ex.getMessage()));
    }

    @ExceptionHandler(ImageInvalideException.class)
    public ResponseEntity<ErreurApi> gererImageInvalide(ImageInvalideException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(ErreurApi.de(415, ex.getMessage()));
    }

    @ExceptionHandler({MultipartException.class, MissingServletRequestPartException.class})
    public ResponseEntity<ErreurApi> gererEnvoiInvalide(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErreurApi.de(400, "Envoi d'image invalide."));
    }

    /**
     * Modification concurrente d'un stock (@Version, migration V10) : 409 avec le
     * message attendu par l'écran Gestion > Stocks, au lieu d'un 500 brut.
     */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ErreurApi> gererConflitEcriture(OptimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErreurApi.de(409, "La quantité a changé entre-temps. Rechargez la page."));
    }
}
