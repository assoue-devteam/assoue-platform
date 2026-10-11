package bf.assoue.platform.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReinitialisationMotDePasseRequest(
        @NotBlank String jeton,
        @NotBlank @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères") String nouveauMotDePasse
) {
}
