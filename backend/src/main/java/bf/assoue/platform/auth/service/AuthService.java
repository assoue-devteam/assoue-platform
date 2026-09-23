package bf.assoue.platform.auth.service;

import bf.assoue.platform.auth.dto.AuthResponse;
import bf.assoue.platform.auth.dto.LoginRequest;
import bf.assoue.platform.auth.dto.RegisterRequest;
import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.RoleRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.common.exception.CompteBloqueException;
import bf.assoue.platform.common.exception.EmailDejaUtiliseException;
import bf.assoue.platform.common.exception.IdentifiantsInvalidesException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final int TENTATIVES_MAX_AVANT_BLOCAGE = 3;
    private static final String ROLE_PAR_DEFAUT = "CLIENT";

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UtilisateurDetailsService utilisateurDetailsService;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse inscrire(RegisterRequest requete) {
        if (utilisateurRepository.existsByEmail(requete.email())) {
            throw new EmailDejaUtiliseException(requete.email());
        }

        Role rolePardefaut = roleRepository.findByNom(ROLE_PAR_DEFAUT)
                .orElseThrow(() -> new IllegalStateException("Rôle " + ROLE_PAR_DEFAUT + " manquant en base — vérifier les migrations Flyway"));

        Utilisateur utilisateur = Utilisateur.builder()
                .email(requete.email())
                .motDePasse(passwordEncoder.encode(requete.motDePasse()))
                .nom(requete.nom())
                .prenom(requete.prenom())
                .roles(Set.of(rolePardefaut))
                .build();

        utilisateurRepository.save(utilisateur);

        return construireReponse(utilisateur);
    }

    @Transactional
    public AuthResponse connecter(LoginRequest requete) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(requete.email())
                .orElseThrow(IdentifiantsInvalidesException::new);

        if (utilisateur.getTentativesEchouees() >= TENTATIVES_MAX_AVANT_BLOCAGE) {
            throw new CompteBloqueException();
        }

        if (!passwordEncoder.matches(requete.motDePasse(), utilisateur.getMotDePasse())) {
            utilisateur.setTentativesEchouees(utilisateur.getTentativesEchouees() + 1);
            utilisateurRepository.save(utilisateur);
            throw new IdentifiantsInvalidesException();
        }

        utilisateur.setTentativesEchouees(0);
        utilisateurRepository.save(utilisateur);

        return construireReponse(utilisateur);
    }

    private AuthResponse construireReponse(Utilisateur utilisateur) {
        UserDetails userDetails = utilisateurDetailsService.loadUserByUsername(utilisateur.getEmail());
        String token = jwtService.genererToken(userDetails);
        Set<String> roles = utilisateur.getRoles().stream().map(Role::getNom).collect(Collectors.toSet());
        return new AuthResponse(token, utilisateur.getEmail(), roles);
    }

}
