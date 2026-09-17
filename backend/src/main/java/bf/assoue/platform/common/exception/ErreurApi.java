package bf.assoue.platform.common.exception;

import java.time.Instant;

public record ErreurApi(Instant horodatage, int statut, String message) {

    public static ErreurApi de(int statut, String message) {
        return new ErreurApi(Instant.now(), statut, message);
    }

}
