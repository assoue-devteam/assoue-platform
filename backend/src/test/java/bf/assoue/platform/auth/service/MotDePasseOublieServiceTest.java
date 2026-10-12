package bf.assoue.platform.auth.service;

import bf.assoue.platform.auth.model.CodeReinitialisation;
import bf.assoue.platform.auth.model.JetonReset;
import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.CodeReinitialisationRepository;
import bf.assoue.platform.auth.repository.JetonResetRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.TropDeRequetesException;
import bf.assoue.platform.common.mail.CanalEnvoi;
import bf.assoue.platform.common.mail.MailProprietes;
import bf.assoue.platform.common.mail.MessageEmail;
import bf.assoue.platform.common.mail.ServiceNotification;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MotDePasseOublieServiceTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private CodeReinitialisationRepository codeRepository;
    @Mock private JetonResetRepository jetonResetRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private CanalEnvoi canalEnvoi;
    @Mock private RateLimiterIp rateLimiterIp;
    @Mock private PlatformTransactionManager transactionManager;

    private MotDePasseOublieProperties proprietes;
    private ServiceNotification serviceNotification;
    private MotDePasseOublieService service;

    @BeforeEach
    void setUp() {
        proprietes = new MotDePasseOublieProperties();
        serviceNotification = new ServiceNotification(canalEnvoi, new MailProprietes());
        service = new MotDePasseOublieService(
                utilisateurRepository, codeRepository, jetonResetRepository,
                passwordEncoder, jwtService, serviceNotification, proprietes, rateLimiterIp,
                transactionManager);
        service.init();
    }

    @Test
    void demanderCode_reponseUniforme_quandCompteInconnu() {
        when(rateLimiterIp.autoriser(anyString())).thenReturn(true);
        when(utilisateurRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        var reponse = service.demanderCode("inconnu@example.com", "127.0.0.1");

        assertThat(reponse.message()).contains("Si un compte existe");
        verify(codeRepository, never()).save(any());
        verify(canalEnvoi, never()).envoyer(any());
    }

    @Test
    void demanderCode_genereEtHacheLeCode_quandClient() {
        when(rateLimiterIp.autoriser(anyString())).thenReturn(true);
        Utilisateur client = Utilisateur.builder().id(1L).email("c@example.com")
                .roles(Set.of(new Role(1L, "CLIENT"))).build();
        when(utilisateurRepository.findByEmail("c@example.com")).thenReturn(Optional.of(client));
        when(codeRepository.findFirstByUtilisateurAndConsommeFalseAndDateExpirationAfterOrderByDateCreationDesc(any(), any()))
                .thenReturn(Optional.empty());
        when(codeRepository.findByUtilisateurAndDateCreationAfter(any(), any())).thenReturn(List.of());
        when(codeRepository.findByUtilisateurAndConsommeFalseAndDateExpirationAfter(any(), any())).thenReturn(List.of());

        service.demanderCode("c@example.com", "127.0.0.1");

        ArgumentCaptor<CodeReinitialisation> captor = ArgumentCaptor.forClass(CodeReinitialisation.class);
        verify(codeRepository).save(captor.capture());
        assertThat(captor.getValue().getCodeHache()).hasSize(64);
        assertThat(captor.getValue().getEssaisRestants()).isEqualTo(5);
        verify(canalEnvoi).envoyer(any(MessageEmail.class));
    }

    @Test
    void demanderCode_nEnvoiePasQuandAdmin() {
        when(rateLimiterIp.autoriser(anyString())).thenReturn(true);
        Utilisateur admin = Utilisateur.builder().id(1L).email("a@assoue.bf")
                .roles(Set.of(new Role(1L, "ADMIN"))).build();
        when(utilisateurRepository.findByEmail("a@assoue.bf")).thenReturn(Optional.of(admin));

        var reponse = service.demanderCode("a@assoue.bf", "127.0.0.1");

        assertThat(reponse.message()).contains("Si un compte existe");
        verify(canalEnvoi, never()).envoyer(any());
        verify(codeRepository, never()).save(any());
    }

    @Test
    void demanderCode_refuseQuandRateLimitIpDepasse() {
        when(rateLimiterIp.autoriser(anyString())).thenReturn(false);

        assertThatThrownBy(() -> service.demanderCode("c@example.com", "127.0.0.1"))
                .isInstanceOf(TropDeRequetesException.class);
    }

    @Test
    void demanderCode_refuseQuandDelaiEntreEnvoisPasRespecte() {
        when(rateLimiterIp.autoriser(anyString())).thenReturn(true);
        Utilisateur client = Utilisateur.builder().id(1L).email("c@example.com")
                .roles(Set.of(new Role(1L, "CLIENT"))).build();
        when(utilisateurRepository.findByEmail("c@example.com")).thenReturn(Optional.of(client));
        CodeReinitialisation recent = CodeReinitialisation.builder()
                .dateCreation(LocalDateTime.now().minusSeconds(60))
                .build();
        when(codeRepository.findFirstByUtilisateurAndConsommeFalseAndDateExpirationAfterOrderByDateCreationDesc(any(), any()))
                .thenReturn(Optional.of(recent));

        assertThatThrownBy(() -> service.demanderCode("c@example.com", "127.0.0.1"))
                .isInstanceOf(TropDeRequetesException.class);
    }

    @Test
    void verifierCode_leveErreurUniforme_quandCompteInconnu() {
        when(utilisateurRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifierCode("inconnu@example.com", "123456"))
                .isInstanceOf(RequeteInvalideException.class);
    }

    @Test
    void verifierCode_leveErreur_quandAucunCodeActif() {
        Utilisateur client = Utilisateur.builder().id(1L).email("c@example.com")
                .roles(Set.of(new Role(1L, "CLIENT"))).build();
        when(utilisateurRepository.findByEmail("c@example.com")).thenReturn(Optional.of(client));
        when(codeRepository.findFirstByUtilisateurAndConsommeFalseAndDateExpirationAfterOrderByDateCreationDesc(any(), any()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifierCode("c@example.com", "123456"))
                .isInstanceOf(RequeteInvalideException.class);
    }

    @Test
    void verifierCode_incrementeLesEssaisSurMauvaisCode() {
        Utilisateur client = Utilisateur.builder().id(1L).email("c@example.com")
                .roles(Set.of(new Role(1L, "CLIENT"))).build();
        when(utilisateurRepository.findByEmail("c@example.com")).thenReturn(Optional.of(client));
        CodeReinitialisation code = CodeReinitialisation.builder()
                .essaisRestants(3).codeHache("hashfaux").build();
        when(codeRepository.findFirstByUtilisateurAndConsommeFalseAndDateExpirationAfterOrderByDateCreationDesc(any(), any()))
                .thenReturn(Optional.of(code));

        assertThatThrownBy(() -> service.verifierCode("c@example.com", "000000"))
                .isInstanceOf(RequeteInvalideException.class);
        verify(codeRepository).save(argThat(c -> c.getEssaisRestants() == 2));
    }

    @Test
    void reinitialiser_leveErreur_quetJetonInvalide() {
        when(jwtService.extraireEmail(anyString())).thenThrow(new RuntimeException("invalide"));

        assertThatThrownBy(() -> service.reinitialiser("fauxjeton", "nouveaupass"))
                .isInstanceOf(RequeteInvalideException.class);
    }

    @Test
    void reinitialiser_leveErreur_quetJetonConsomme() {
        when(jwtService.extraireEmail("jeton")).thenReturn("c@example.com");
        when(jwtService.extraireJti("jeton")).thenReturn("jti-1");
        JetonReset jetonReset = JetonReset.builder().jti("jti-1").consomme(true).build();
        when(jetonResetRepository.findByJti("jti-1")).thenReturn(Optional.of(jetonReset));

        assertThatThrownBy(() -> service.reinitialiser("jeton", "nouveaupass"))
                .isInstanceOf(RequeteInvalideException.class);
    }
}
