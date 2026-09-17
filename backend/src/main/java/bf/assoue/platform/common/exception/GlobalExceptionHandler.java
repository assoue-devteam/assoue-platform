package bf.assoue.platform.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErreurApi> gererValidationInvalide(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErreurApi.de(400, message));
    }

}
