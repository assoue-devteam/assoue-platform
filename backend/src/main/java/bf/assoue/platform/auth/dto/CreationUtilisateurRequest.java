package bf.assoue.platform.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * Création d'un compte par le super admin — c'est le seul chemin pour obtenir un
 * compte COLLECTEUR ou ADMIN, l'inscription publique créant toujours un CLIENT.
 */
public record CreationUtilisateurRequest(
        @Email @NotEmpty String email,
        @Size(min = 8, message = "Le mot de passe doit faire au moins 8 caractères") String motDePasse,
        String nom,
        String prenom,
        @NotEmpty(message = "Au moins un rôle est requis") Set<String> roles
) {
}
