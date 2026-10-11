package bf.assoue.platform.auth.service;

import bf.assoue.platform.auth.dto.ReponseMotDePasseOublie;
import bf.assoue.platform.auth.model.CodeReinitialisation;
import bf.assoue.platform.auth.model.JetonReset;
import bf.assoue.platform.auth.model.Role;
import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.CodeReinitialisationRepository;
import bf.assoue.platform.auth.repository.JetonResetRepository;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.TropDeRequetesException;
import bf.assoue.platform.common.mail.MessageEmail;
import bf.assoue.platform.common.mail.ModelesEmail;
import bf.assoue.platform.common.mail.ServiceNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MotDePasseOublieService {

    private static final String MESSAGE_UNIFORME =
            "Si un compte existe avec cette adresse, un code de réinitialisation a été envoyé.";
    private static final String ERREUR_CODE_INVALIDE = "Code invalide ou expiré.";
    private static final String ERREUR_JETON_INVALIDE = "Jeton invalide ou expiré.";

    private final UtilisateurRepository utilisateurRepository;
    private final CodeReinitialisationRepository codeRepository;
    private final JetonResetRepository jetonResetRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ServiceNotification serviceNotification;
    private final MotDePasseOublieProperties proprietes;
    private final RateLimiterIp rateLimiterIp;
    private final PlatformTransactionManager transactionManager;
    private TransactionTemplate transactionCode;

    @jakarta.annotation.PostConstruct
    void init() {
        transactionCode = new TransactionTemplate(transactionManager);
        transactionCode.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
    }

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public ReponseMotDePasseOublie demanderCode(String email, String ip) {
        if (!rateLimiterIp.autoriser(ip)) {
            throw new TropDeRequetesException("Trop de tentatives, réessayez plus tard.");
        }

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);

        if (utilisateur != null && !aRoleAdmin(utilisateur)) {
            verifierDelaiEtPlafond(utilisateur);
            String code = genererCode();
            String codeHache = hmac(code);
            invaliderCodesPrecedents(utilisateur);
            sauvegarderCode(utilisateur, codeHache);
            envoyerCodeAsync(email, code);
        } else {
            hmac(email + System.nanoTime());
        }

        return new ReponseMotDePasseOublie(MESSAGE_UNIFORME);
    }

    @Transactional
    public String verifierCode(String email, String code) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);

        if (utilisateur == null) {
            hmac(code + System.nanoTime());
            throw new RequeteInvalideException(ERREUR_CODE_INVALIDE);
        }

        CodeReinitialisation codeEntity = codeRepository
                .findFirstByUtilisateurAndConsommeFalseAndDateExpirationAfterOrderByDateCreationDesc(
                        utilisateur, LocalDateTime.now())
                .orElse(null);

        if (codeEntity == null) {
            throw new RequeteInvalideException(ERREUR_CODE_INVALIDE);
        }

        if (!codeEntity.getCodeHache().equals(hmac(code))) {
            codeEntity.setEssaisRestants(codeEntity.getEssaisRestants() - 1);
            if (codeEntity.getEssaisRestants() <= 0) {
                codeEntity.setConsomme(true);
            }
            transactionCode.executeWithoutResult(status -> codeRepository.save(codeEntity));
            throw new RequeteInvalideException(ERREUR_CODE_INVALIDE);
        }

        String jti = UUID.randomUUID().toString();
        JetonReset jetonReset = JetonReset.builder()
                .jti(jti)
                .utilisateur(utilisateur)
                .consomme(false)
                .build();
        jetonResetRepository.save(jetonReset);

        return jwtService.genererJetonReset(email, jti, proprietes.getJetonDureeMin() * 60_000L);
    }

    @Transactional
    public void reinitialiser(String jeton, String nouveauMotDePasse) {
        String email;
        String jti;
        try {
            email = jwtService.extraireEmail(jeton);
            jti = jwtService.extraireJti(jeton);
        } catch (Exception e) {
            throw new RequeteInvalideException(ERREUR_JETON_INVALIDE);
        }

        JetonReset jetonReset = jetonResetRepository.findByJti(jti).orElse(null);
        if (jetonReset == null || jetonReset.isConsomme()) {
            throw new RequeteInvalideException(ERREUR_JETON_INVALIDE);
        }

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);
        if (utilisateur == null) {
            throw new RequeteInvalideException(ERREUR_JETON_INVALIDE);
        }

        jetonReset.setConsomme(true);
        jetonReset.setDateConsommation(LocalDateTime.now());
        jetonResetRepository.save(jetonReset);

        utilisateur.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        utilisateur.setMotDePasseModifieLe(LocalDateTime.now());
        utilisateurRepository.save(utilisateur);

        envoyerConfirmationAsync(email);
    }

    private void verifierDelaiEtPlafond(Utilisateur utilisateur) {
        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime delaiMin = maintenant.minusSeconds(proprietes.getDelaiEntreEnvoisSecondes());

        CodeReinitialisation dernierCode = codeRepository
                .findFirstByUtilisateurAndConsommeFalseAndDateExpirationAfterOrderByDateCreationDesc(
                        utilisateur, maintenant)
                .orElse(null);

        if (dernierCode != null && dernierCode.getDateCreation().isAfter(delaiMin)) {
            throw new TropDeRequetesException("Un code a déjà été envoyé, réessayez plus tard.");
        }

        LocalDateTime ilYAH = maintenant.minusHours(1);
        long codesHeure = codeRepository
                .findByUtilisateurAndDateCreationAfter(utilisateur, ilYAH)
                .size();
        if (codesHeure >= proprietes.getPlafondParHeure()) {
            throw new TropDeRequetesException("Trop de codes demandés, réessayez plus tard.");
        }
    }

    private void invaliderCodesPrecedents(Utilisateur utilisateur) {
        codeRepository
                .findByUtilisateurAndConsommeFalseAndDateExpirationAfter(utilisateur, LocalDateTime.now())
                .forEach(c -> {
                    c.setConsomme(true);
                    codeRepository.save(c);
                });
    }

    private void sauvegarderCode(Utilisateur utilisateur, String codeHache) {
        CodeReinitialisation code = CodeReinitialisation.builder()
                .utilisateur(utilisateur)
                .codeHache(codeHache)
                .dateExpiration(LocalDateTime.now().plusMinutes(proprietes.getCodeDureeMin()))
                .essaisRestants(proprietes.getCodeEssaisMax())
                .consomme(false)
                .build();
        codeRepository.save(code);
    }

    private String genererCode() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private String hmac(String valeur) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(proprietes.getCleHmac().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(valeur.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Échec HMAC", e);
        }
    }

    private boolean aRoleAdmin(Utilisateur utilisateur) {
        return utilisateur.getRoles().stream()
                .map(Role::getNom)
                .anyMatch("ADMIN"::equals);
    }

    private void envoyerCodeAsync(String email, String code) {
        String sujet = "Code de réinitialisation — AS'Soué";
        String corpsHtml = "<p>Votre code de réinitialisation : <strong>" + code + "</strong></p>"
                + "<p>Ce code est valable " + proprietes.getCodeDureeMin() + " minutes.</p>";
        String corpsTexte = "Votre code de réinitialisation : " + code
                + "\nCe code est valable " + proprietes.getCodeDureeMin() + " minutes.";
        serviceNotification.envoyerAsynchrone(new MessageEmail(
                email, sujet,
                ModelesEmail.html("Code de réinitialisation", corpsHtml),
                ModelesEmail.texte("Code de réinitialisation", corpsTexte)));
    }

    private void envoyerConfirmationAsync(String email) {
        String sujet = "Mot de passe modifié — AS'Soué";
        String corpsHtml = "<p>Votre mot de passe a été modifié avec succès.</p>";
        String corpsTexte = "Votre mot de passe a été modifié avec succès.";
        serviceNotification.envoyerAsynchrone(new MessageEmail(
                email, sujet,
                ModelesEmail.html("Mot de passe modifié", corpsHtml),
                ModelesEmail.texte("Mot de passe modifié", corpsTexte)));
    }
}
