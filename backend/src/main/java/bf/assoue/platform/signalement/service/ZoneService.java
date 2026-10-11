package bf.assoue.platform.signalement.service;

import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.signalement.dto.ZoneRequest;
import bf.assoue.platform.signalement.dto.ZoneResponse;
import bf.assoue.platform.signalement.model.Zone;
import bf.assoue.platform.signalement.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ZoneService {

    private final ZoneRepository zoneRepository;

    @Transactional(readOnly = true)
    public Page<ZoneResponse> lister(Pageable pageable) {
        return zoneRepository.findAll(pageable).map(ZoneResponse::de);
    }

    @Transactional(readOnly = true)
    public Page<ZoneResponse> listerActives(Pageable pageable) {
        return zoneRepository.findByActifTrueOrderByNomAsc(pageable).map(ZoneResponse::de);
    }

    @Transactional
    public ZoneResponse creer(ZoneRequest request) {
        if (zoneRepository.findByNomIgnoreCase(request.nom()).isPresent()) {
            throw new RequeteInvalideException("Une zone avec ce nom existe déjà.");
        }
        Zone zone = Zone.builder().nom(request.nom()).actif(true).build();
        return ZoneResponse.de(zoneRepository.save(zone));
    }

    @Transactional
    public ZoneResponse modifier(Long id, ZoneRequest request) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Zone introuvable : " + id));
        if (!zone.getNom().equalsIgnoreCase(request.nom()) && zoneRepository.findByNomIgnoreCase(request.nom()).isPresent()) {
            throw new RequeteInvalideException("Une zone avec ce nom existe déjà.");
        }
        zone.setNom(request.nom());
        return ZoneResponse.de(zoneRepository.save(zone));
    }

    @Transactional
    public void desactiver(Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Zone introuvable : " + id));
        if (!zone.isActif()) return;
        // Vérifier si la zone est utilisée par des signalements actifs
        // Pour l'instant, on permet la désactivation (jamais de suppression)
        zone.setActif(false);
        zoneRepository.save(zone);
    }
}