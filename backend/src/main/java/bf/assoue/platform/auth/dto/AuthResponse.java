package bf.assoue.platform.auth.dto;

import java.util.Set;

public record AuthResponse(
        String token,
        String email,
        Set<String> roles
) {
}
