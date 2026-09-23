package bf.assoue.platform.auth.dto;

import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.service.AuthService;

import java.util.Set;
import java.util.stream.Collectors;

public record UtilisateurResponse(
        Long id,
        String email,
        String nom,
        String prenom,
        boolean verrouille,
        Set<String> roles
) {

    public static UtilisateurResponse depuis(Utilisateur utilisateur) {
        Set<String> roles = utilisateur.getRoles().stream().map(Role::getNom).collect(Collectors.toSet());
        boolean verrouille = utilisateur.getTentativesEchouees() >= AuthService.TENTATIVES_MAX_AVANT_BLOCAGE;
        return new UtilisateurResponse(
                utilisateur.getId(),
                utilisateur.getEmail(),
                utilisateur.getNom(),
                utilisateur.getPrenom(),
                verrouille,
                roles
        );
    }

}
