package bf.assoue.platform.auth.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

public record MajRolesRequest(@NotEmpty(message = "Au moins un rôle est requis") Set<String> roles) {
}
