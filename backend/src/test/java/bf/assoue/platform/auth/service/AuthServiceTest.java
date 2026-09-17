package bf.assoue.platform.auth.service;

import bf.assoue.platform.auth.dto.LoginRequest;
import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.RoleRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.common.exception.CompteBloqueException;
import bf.assoue.platform.common.exception.IdentifiantsInvalidesException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UtilisateurDetailsService utilisateurDetailsService;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private Utilisateur utilisateur;

    @BeforeEach
    void setUp() {
        utilisateur = Utilisateur.builder()
                .id(1L)
                .email("client@example.com")
                .motDePasse("hash")
                .tentativesEchouees(0)
                .roles(Set.of(new Role(1L, "CLIENT")))
                .build();
    }

    @Test
    void connecter_incrementeLesTentativesEchoueesSurMauvaisMotDePasse() {
        when(utilisateurRepository.findByEmail("client@example.com")).thenReturn(Optional.of(utilisateur));
        when(passwordEncoder.matches("mauvais", "hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.connecter(new LoginRequest("client@example.com", "mauvais")))
                .isInstanceOf(IdentifiantsInvalidesException.class);

        assertThat(utilisateur.getTentativesEchouees()).isEqualTo(1);
        verify(utilisateurRepository).save(utilisateur);
    }

    @Test
    void connecter_refuseApres3TentativesEchouees() {
        utilisateur.setTentativesEchouees(3);
        when(utilisateurRepository.findByEmail("client@example.com")).thenReturn(Optional.of(utilisateur));

        assertThatThrownBy(() -> authService.connecter(new LoginRequest("client@example.com", "peu importe")))
                .isInstanceOf(CompteBloqueException.class);

        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void connecter_reinitialiseLesTentativesEchoueesSurSucces() {
        utilisateur.setTentativesEchouees(2);
        when(utilisateurRepository.findByEmail("client@example.com")).thenReturn(Optional.of(utilisateur));
        when(passwordEncoder.matches("bonMotDePasse", "hash")).thenReturn(true);
        when(utilisateurDetailsService.loadUserByUsername("client@example.com"))
                .thenReturn(User.builder().username("client@example.com").password("hash").authorities("ROLE_CLIENT").build());
        when(jwtService.genererToken(any())).thenReturn("un-token");

        authService.connecter(new LoginRequest("client@example.com", "bonMotDePasse"));

        assertThat(utilisateur.getTentativesEchouees()).isZero();
    }

}
