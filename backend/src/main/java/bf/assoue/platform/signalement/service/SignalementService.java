package bf.assoue.platform.signalement.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.common.mail.MessageEmail;
import bf.assoue.platform.common.mail.ModelesEmail;
import bf.assoue.platform.common.mail.ServiceNotification;
import bf.assoue.platform.common.notification.SignaleCreeEvent;
import bf.assoue.platform.signalement.dto.CreerSignalementRequest;
import bf.assoue.platform.signalement.dto.PhotoSignalementResponse;
import bf.assoue.platform.signalement.dto.SignalementResponse;
import bf.assoue.platform.signalement.dto.ValiderSignalementRequest;
import bf.assoue.platform.signalement.model.PhotoSignalement;
import bf.assoue.platform.signalement.model.Signalement;
import bf.assoue.platform.signalement.repository.PhotoSignalementRepository;
import bf.assoue.platform.signalement.repository.SignalementRepository;
import bf.assoue.platform.signalement.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final ZoneRepository zoneRepository;
    private final PhotoSignalementRepository photoSignalementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PointsService pointsService;
    private final ServiceNotification serviceNotification;
    private final ApplicationEventPublisher eventPublisher;
    private final PointsProperties pointsProperties;

    @Transactional
    public SignalementResponse creer(CreerSignalementRequest request, String emailClient, List<MultipartFile> photos) {
        Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RessourceIntrouvableException("Client introuvable : " + emailClient));

        if (!pointsProperties.isActif()) {
            throw new RequeteInvalideException("Le système de signalement n'est pas actif.");
        }

        if (photos == null || photos.isEmpty()) {
            throw new RequeteInvalideException("Au moins une photo est requise.");
        }
        if (photos.size() > 5) {
            throw new RequeteInvalideException("Maximum 5 photos par signalement.");
        }

        var zone = zoneRepository.findById(request.zoneId())
                .orElseThrow(() -> new RessourceIntrouvableException("Zone introuvable : " + request.zoneId()));
        if (!zone.isActif()) {
            throw new RequeteInvalideException("Cette zone n'est plus active.");
        }

        verifierLimiteJournalier(client);
        verifierDoublonPossible(client, zone);

        Signalement signalement = Signalement.builder()
                .client(client)
                .zone(zone)
                .description(request.description())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .statut("EN_ATTENTE")
                .build();
        signalementRepository.save(signalement);

        for (MultipartFile fichier : photos) {
            if (fichier.isEmpty()) continue;
            String cle = UUID.randomUUID() + "." + extension(fichier.getOriginalFilename());
            PhotoSignalement photo = PhotoSignalement.builder()
                    .signalement(signalement)
                    .cle(cle)
                    .contentType(fichier.getContentType())
                    .build();
            photoSignalementRepository.save(photo);
            stockerFichier(cle, fichier);
        }

        eventPublisher.publishEvent(new SignaleCreeEvent(signalement.getId(), zone.getNom(), LocalDateTime.now()));

        return SignalementResponse.de(signalement);
    }

    @Transactional(readOnly = true)
    public Page<SignalementResponse> mesSignalements(Utilisateur client, Pageable pageable) {
        return signalementRepository.findByClient(client, pageable).map(SignalementResponse::de);
    }

    @Transactional(readOnly = true)
    public SignalementResponse consulter(Long id, Utilisateur client) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Signalement introuvable : " + id));
        if (!signalement.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("Accès refusé à ce signalement");
        }
        return SignalementResponse.de(signalement);
    }

    @Transactional
    public SignalementResponse valider(Long id, ValiderSignalementRequest request, String emailAdmin) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Signalement introuvable : " + id));

        if (!"EN_ATTENTE".equals(signalement.getStatut())) {
            throw new RequeteInvalideException("Ce signalement a déjà été traité.");
        }

        Utilisateur admin = utilisateurRepository.findByEmail(emailAdmin)
                .orElseThrow(() -> new RessourceIntrouvableException("Admin introuvable : " + emailAdmin));

        boolean accepte = request.motifRejet() == null || request.motifRejet().isBlank();
        signalement.setStatut(accepte ? "VALIDE" : "REJETE");
        if (!accepte) {
            signalement.setMotifRejet(request.motifRejet());
        }
        signalement.setDateValidation(LocalDateTime.now());
        signalement.setValidePar(admin);
        signalementRepository.save(signalement);

        if (accepte) {
            pointsService.crediterPourSignalement(signalement);
            envoyerNotificationClient(signalement.getClient().getEmail(),
                    "Votre signalement a été validé", "Vous avez gagné " + pointsProperties.getPointsParSignalement() + " points.");
        } else {
            envoyerNotificationClient(signalement.getClient().getEmail(),
                    "Votre signalement a été rejeté", "Motif : " + signalement.getMotifRejet());
        }

        return SignalementResponse.de(signalement);
    }

    @Transactional
    public void lierCollecte(Long signalementId) {
        Signalement signalement = signalementRepository.findById(signalementId)
                .orElseThrow(() -> new RessourceIntrouvableException("Signalement introuvable : " + signalementId));
        if (!"VALIDE".equals(signalement.getStatut())) {
            throw new RequeteInvalideException("Seul un signalement validé peut être lié à une collecte.");
        }
    }

    private void verifierLimiteJournalier(Utilisateur client) {
        LocalDateTime debutJour = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long count = signalementRepository.countByClientAndDateCreationBetween(client, debutJour, LocalDateTime.now());
        if (count >= pointsProperties.getPlafondJournalier()) {
            throw new RequeteInvalideException("Limite de " + pointsProperties.getPlafondJournalier() + " signalements par jour atteinte.");
        }
    }

    private void verifierDoublonPossible(Utilisateur client, bf.assoue.platform.signalement.model.Zone zone) {
        LocalDateTime ilYA24h = LocalDateTime.now().minusHours(24);
        var existant = signalementRepository.findByClientAndZoneAndDateCreationBetween(client, zone, ilYA24h, LocalDateTime.now());
        if (existant.isPresent()) {
            throw new RequeteInvalideException("Un signalement récent existe déjà pour cette zone.");
        }
    }

    private void envoyerNotificationClient(String email, String titre, String corps) {
        serviceNotification.envoyerAsynchrone(new MessageEmail(
                email, titre,
                ModelesEmail.html(titre, "<p>" + corps + "</p>"),
                ModelesEmail.texte(titre, corps)));
    }

    private String extension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        return Set.of("jpg", "jpeg", "png", "webp").contains(ext) ? ext : "jpg";
    }

    private void stockerFichier(String cle, MultipartFile fichier) {
        // TODO: réutiliser ImageService/StockageImage pour le stockage réel
        log.info("Stockage photo signalement cle={} size={}", cle, fichier.getSize());
    }
}