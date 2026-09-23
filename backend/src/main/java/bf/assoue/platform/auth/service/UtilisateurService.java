package bf.assoue.platform.auth.service;

import bf.assoue.platform.auth.dto.CreationUtilisateurRequest;
import bf.assoue.platform.auth.dto.MajRolesRequest;
import bf.assoue.platform.auth.dto.UtilisateurResponse;
import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.RoleRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.common.exception.EmailDejaUtiliseException;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Administration des comptes par le super admin (SA-01) : c'est par ici que sont
 * créés les comptes COLLECTEUR, l'inscription publique ne donnant que le rôle CLIENT.
 */
@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UtilisateurResponse> lister() {
        return utilisateurRepository.findAll().stream().map(UtilisateurResponse::depuis).toList();
    }

    @Transactional
    public UtilisateurResponse creer(CreationUtilisateurRequest requete) {
        if (utilisateurRepository.existsByEmail(requete.email())) {
            throw new EmailDejaUtiliseException(requete.email());
        }

        Utilisateur utilisateur = Utilisateur.builder()
                .email(requete.email())
                .motDePasse(passwordEncoder.encode(requete.motDePasse()))
                .nom(requete.nom())
                .prenom(requete.prenom())
                .roles(resoudreRoles(requete.roles()))
                .build();

        return UtilisateurResponse.depuis(utilisateurRepository.save(utilisateur));
    }

    @Transactional
    public UtilisateurResponse remplacerRoles(Long utilisateurId, MajRolesRequest requete) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable : " + utilisateurId));

        utilisateur.setRoles(resoudreRoles(requete.roles()));

        return UtilisateurResponse.depuis(utilisateurRepository.save(utilisateur));
    }

    private Set<Role> resoudreRoles(Set<String> noms) {
        return noms.stream()
                .map(nom -> roleRepository.findByNom(nom)
                        .orElseThrow(() -> new RequeteInvalideException("Rôle inconnu : " + nom)))
                .collect(Collectors.toSet());
    }

}
