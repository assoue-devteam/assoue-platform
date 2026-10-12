package bf.assoue.platform.common.notification;

import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Page<Notification> lister(String destinataire, Boolean lue, int page, int taille) {
        Pageable pageable = PageRequest.of(page, taille, Sort.by("dateCreation").descending());
        if (lue != null) {
            return notificationRepository.findByDestinataireAndLue(destinataire, lue, pageable);
        }
        return notificationRepository.findByDestinataire(destinataire, pageable);
    }

    @Transactional(readOnly = true)
    public long compterNonLues(String destinataire) {
        return notificationRepository.countByDestinataireAndLue(destinataire, false);
    }

    @Transactional
    public void marquerLue(Long id, String destinataire) {
        int modifie = notificationRepository.marquerLue(id, destinataire);
        if (modifie == 0) {
            throw new RessourceIntrouvableException("Notification introuvable : " + id);
        }
    }

    @Transactional
    public void marquerToutesLues(String destinataire) {
        notificationRepository.marquerToutesLues(destinataire);
    }

    public String destinataireCourant() {
        Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext()
                .getAuthentication().getAuthorities();
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("ADMIN");
    }
}
