package bf.assoue.platform.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record DemandeMotDePasseOublieRequest(
        @NotBlank @Email String email
) {
}
