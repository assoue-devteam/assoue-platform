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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UtilisateurServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UtilisateurService utilisateurService;

    @Test
    void creer_attribueLeRoleCollecteurDemande() {
        when(utilisateurRepository.existsByEmail("collecteur@example.com")).thenReturn(false);
        when(roleRepository.findByNom("COLLECTEUR")).thenReturn(Optional.of(new Role(2L, "COLLECTEUR")));
        when(passwordEncoder.encode("motdepasse")).thenReturn("hash");
        when(utilisateurRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UtilisateurResponse reponse = utilisateurService.creer(new CreationUtilisateurRequest(
                "collecteur@example.com", "motdepasse", "Sawadogo", "Issa", Set.of("COLLECTEUR")));

        assertThat(reponse.roles()).containsExactly("COLLECTEUR");
        assertThat(reponse.verrouille()).isFalse();
    }

    @Test
    void creer_refuseUnEmailDejaUtilise() {
        when(utilisateurRepository.existsByEmail("collecteur@example.com")).thenReturn(true);

        assertThatThrownBy(() -> utilisateurService.creer(new CreationUtilisateurRequest(
                "collecteur@example.com", "motdepasse", "Sawadogo", "Issa", Set.of("COLLECTEUR"))))
                .isInstanceOf(EmailDejaUtiliseException.class);

        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    void remplacerRoles_refuseUnRoleInconnu() {
        Utilisateur utilisateur = Utilisateur.builder()
                .id(1L)
                .email("client@example.com")
                .roles(Set.of(new Role(1L, "CLIENT")))
                .build();
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(utilisateur));
        when(roleRepository.findByNom("FORMATEUR")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> utilisateurService.remplacerRoles(1L, new MajRolesRequest(Set.of("FORMATEUR"))))
                .isInstanceOf(RequeteInvalideException.class);

        verify(utilisateurRepository, never()).save(any());
    }

}
