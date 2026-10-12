package bf.assoue.platform.common.notification;

import java.time.LocalDateTime;

public record CollecteDeclareeEvent(Long collecteId, String zone, LocalDateTime date) {
}
