package bf.assoue.platform.common.notification;

import java.time.LocalDateTime;

public record SignaleCreeEvent(Long signalementId, String zone, LocalDateTime date) {
}
