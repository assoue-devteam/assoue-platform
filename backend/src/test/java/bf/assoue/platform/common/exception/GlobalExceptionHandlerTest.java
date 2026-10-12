package bf.assoue.platform.common.exception;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.web.servlet.MultipartProperties;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler gestionnaire = new GlobalExceptionHandler(new MultipartProperties());

    @Test
    void conflitEcritureStock_renvoie409AvecMessageAction() {
        var reponse = gestionnaire.gererConflitEcriture(new OptimisticLockingFailureException("conflit"));

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(reponse.getBody()).isNotNull();
        assertThat(reponse.getBody().statut()).isEqualTo(409);
        assertThat(reponse.getBody().message()).isEqualTo("La quantité a changé entre-temps. Rechargez la page.");
    }
}
